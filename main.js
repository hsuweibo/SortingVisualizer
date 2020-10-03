// Delay between each frame (note the browser supports at the minimum 4ms)
const ANIMATION_DELAY = 4; 
// Default length of the display array
const ARRAY_LEN = 80;
// The maximum height of an array element, in terms of the percentage of the canvas height.
const MAX_ARRAY_HEIGHT = 0.8;
// The maximum width the entire array, in terms of the percentage of the canvas width.
const MAX_ARRAY_WIDTH = 0.85;
// A constant used for translating between array value to height (in pixel). Changing this would not have any significant effects.
const NORMALIZING_CONSTANT = 10000;

// algSelect is the UI element for selecting an algorithm
// btnReset is the button for generating a new array (and thus showing it on the canvas)
// btnPlay is a multipurpose button, for playing and pausing the animation depending on the state of the visualizer.
// btnStop is self-explanatory
const algSelect = document.getElementById("algSelect");
const btnReset = document.getElementById("reset");
const btnPlay = document.getElementById("play");
const btnStop = document.getElementById("stop");

const canvas = document.getElementById("cv");

// Adjust the height of the canvas dynamically, so that it fills the entire viewport.
canvas.width = document.querySelector('html').clientWidth;
canvas.height = document.querySelector('html').clientHeight - document.querySelector('.header').offsetHeight;

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');


btnReset.addEventListener('click', function(){
    vis.setRandomArray();
});

btnStop.addEventListener('click', function(){
    vis.stopAnimation();
});


btnPlay.addEventListener('click', function(){
    if (vis.state === 'stopped' || vis.state === 'paused'){
        vis.playAnimation(ANIMATION_DELAY);
    }else if (vis.state === 'finished'){
        vis.restartAnimation();
    }else if (vis.state === 'playing'){
        vis.pauseAnimation();
    }
});


algSelect.addEventListener('change', function(){
    let algValue = algSelect.value;
    let alg;
    if (algValue === 'bubble'){
        alg = bubbleSort;
    }else if (algValue === 'quick'){
        alg = quickSort;
    }else if (algValue === 'merge'){
        alg = mergeSort;
    }else if (algValue === 'insertion'){
        alg = insertionSort;
    }
    vis.setAlgorithm(alg);
})


// This function accepts a visualizer state (defined in the Visualizer constructor function) and updates (disable/enable) the UI buttons accordingly.
function updateButtons(state){
    if (state === 'stopped'){
        btnStop.setAttribute('disabled', '');
        algSelect.removeAttribute('disabled');
        btnReset.removeAttribute('disabled');
        btnPlay.textContent = 'Sort';
    }else if (state === 'playing'){
        btnStop.removeAttribute('disabled');
        algSelect.setAttribute('disabled', '');
        btnReset.setAttribute('disabled', '');
        btnPlay.textContent = 'Pause';
    }else if (state === 'paused'){
        btnStop.removeAttribute('disabled');
        algSelect.setAttribute('disabled', '');
        btnReset.removeAttribute('disabled');
        btnPlay.textContent = 'Resume';
    }else if (state === 'finished'){
        btnStop.setAttribute('disabled', '');
        algSelect.removeAttribute('disabled');
        btnReset.removeAttribute('disabled');
        btnPlay.textContent = 'Restart';
    }
}



// As the visualizer plays animation, we color each element using these color codes, depending on the element's states.
const COLOR = {SWAP: 'rgb(255, 51, 51)', COMPARE: 'DarkSeaGreen', UNSORTED: 'grey', SORTED: 'rgb(170, 128, 255)', HIGHLIGHT: 'orange', PARTIALLY_SORTED: 'CadetBlue'};


/**
 * The implementation below refers to terms like 'sorting array' and 'delta'. These involve object literals, with the following structures.
 * A sorting array represents an array in the visualizer. It is an array of object literals, each of which has a number property called 'value' and a string property called 'color'.
 * 
 * A delta represents a set of info needed to go from one frame to the next in an animation. It is an array of object literals, each of which has the property 'index', and
 * the following optional properties: fromValue, toValue, fromColor, toColor, with self-explanatory semantics. Each of these object literals represent a change in an element
 * in some index of some sorting array.
 */

/**
 * Create a visualizer object, keeping track of the animation being played, the algorithm selected, and visualizer state, and others.
 * @param {number} length the number of elements in the sorting array. 
 * @param {number} range the maximum value an element could have.
 * @param {ArrayView} view the view used to display the sorting array as the animation plays out.
 * @param {Function} alg the currently selected sorting algorithm.
 */
function Visualizer(length, range, view, alg){
    this.sortingAlg = alg;
    this.length = length;
    this.range = range;

    
    // The state of a visualizer describes the state of the animation. 
    // It is either 'stopped', 'playing', 'paused', or 'finished', with self-explanatory semantics.
    this.state = 'stopped';
    this.arrayView = view;
    
    // Keep tracks of the initial sorting array (the sorting array before animation plays out.)
    this.initArray = undefined;

    // A list of 'deltas', which specifies the necessary information to transition from one frame to the next in the animation.
    // Each 'delta' is a list of object, with each object describing the change to some array element at some index.
    this.deltas = undefined;
    // The position in the animation. deltasIndex holds the next frame to process and play out.
    this.deltasIndex = undefined;
    
    // This is used internally, to keep track of the return value of setTimeout.
    this.animationId = undefined;

    this.setRandomArray();
    this.setAlgorithm(this.sortingAlg);
}

/**
 * Sets the sorting algorithm of the visualizer. This recomputes the animation (deltas) needed to play out, and update the canvas to display the initial sorting array.
 * @param {Function} alg 
 */
Visualizer.prototype.setAlgorithm = function(alg){
    this.sortingAlg = alg;
    this.arrayView.setArray(this.initArray);
    this.deltas = this.sortingAlg(this.initArray);
    this.deltasIndex = 0;

    this.state = 'stopped';
    updateButtons(this.state);
}

/**
 * Generates a new random array and sets it as the initial array. Updates the canvas to display the initial sorting array.
 */
Visualizer.prototype.setRandomArray = function(){
    this.initArray = [];
    for (let i = 0; i < this.length; i ++){
        let val = Math.floor(Math.random() * this.range) + 10;
        let element = {value: val, color: COLOR.UNSORTED};
        this.initArray.push(element);
    }

    this.arrayView.setArray(this.initArray);
    this.deltas = this.sortingAlg(this.initArray);
    this.deltasIndex = 0;

    this.state = 'stopped';
    updateButtons(this.state);

}

/**
 * Calls setInterval to play the animation from where it is left off the last time.
 * @param {number} the delay between each frame, in ms.
 */
Visualizer.prototype.playAnimation = function(time){
    function update(){
        if (this.deltasIndex < this.deltas.length){
            let delta = this.deltas[this.deltasIndex];
            this.arrayView.pushDelta(delta);
            this.deltasIndex++;
        }else{
            clearInterval(this.animationId);
            this.state = 'finished';
            updateButtons(this.state);
        }
    }
    const boundUpdate = update.bind(this);
    this.animationId = setInterval(boundUpdate, time);
    
    this.state = 'playing';
    updateButtons(this.state);
}

/**
 * Stops the animation. Update the canvas to display the initial sorting array.
 */
Visualizer.prototype.stopAnimation = function(){
    clearInterval(this.animationId);
    
    this.deltasIndex = 0;
    this.arrayView.setArray(this.initArray);
    
    this.state = 'stopped';
    updateButtons(this.state);
}


Visualizer.prototype.pauseAnimation = function(){
    clearInterval(this.animationId);

    this.state = 'paused';
    updateButtons(this.state);
}

Visualizer.prototype.restartAnimation = function(){
    clearInterval(this.animationId);
    
    this.arrayView.setArray(this.initArray);
    
    this.deltasIndex = 0;
    this.playAnimation(ANIMATION_DELAY);

    // These two lines are technically not needed, as they're done already in playAnimation.
    this.state = 'playing';
    updateButtons(this.state);

}

/**
 * Plays the next frame. Animation should be paused. This function is experimental, does not have an associate UI component.
 */
Visualizer.prototype.playNextFrame = function(){
    if (this.deltasIndex < this.deltas.length){
        let delta = this.deltas[this.deltasIndex];
        this.arrayView.pushDelta(delta);
        this.deltasIndex++;
    }
}

/**
 * Plays the next frame. Animation should be paused. This function is experimental, does not have an associate UI component.
 */
Visualizer.prototype.playPreviousFrame = function(){
    if (this.deltasIndex > 0){
        this.deltasIndex--;
        let delta = this.deltas[this.deltasIndex];
        let newDelta = [];
        for (const elementDelta of delta){
            let newElementDelta = {index: elementDelta.index};
            
            if (("fromColor" in elementDelta) && ("toColor" in elementDelta)){
                newElementDelta.toColor = elementDelta.fromColor;
                newElementDelta.fromColor = elementDelta.toColor;
            }

            if (("fromValue" in elementDelta) && ("toValue" in elementDelta)){
                newElementDelta.toValue = elementDelta.fromValue;
                newElementDelta.fromValue = elementDelta.toValue;
            }
            newDelta.push(newElementDelta);
        }
        this.arrayView.pushDelta(newDelta);
    }
}





/**
 * An ArrayView is a container for the top-down sorting array in our visualizer. It is responsible for all the rendering tasks.
 * The ArrayView keeps track of layout info such as the width and gap, and uses them accordingly in the rendering functions (setArray and pushDelta).
 * @param {CanvasRenderingContext2D} ctx The canvas context used for drawing.
 * @param {int} baselineY The pixel y-position of the array baseline.
 * @param {int} width The pixel width of each array element (bar).
 * @param {int} gap The pixel gap between each array element (bar).
 */
function ArrayView(ctx, baselineY, width, gap){
    this.baselineY = baselineY;
    this.width = width;
    this.gap = gap;
    this.ctx = ctx;

    // The sorting array currently being displayed.
    this.array = undefined;
    // The pixel x-position of the top-left point of the entire array. This is dynamically determined as this.array is set (in the setArray function).
    this.startX = undefined;
}

/**
 * Take an sorting array, clear any previous sorting array in this view, then display it in the canvas. 
 * Note that the clearing is minimal: only the needed parts are cleared, as opposed to clearing the entire canvas.
 * @param {Array} array 
 */
ArrayView.prototype.setArray = function(array){
    // Make a new copy of the array, so that other pointers cannot change the data.
    array = JSON.parse(JSON.stringify(array));

    // Clears the existing array on the canvas.
    if (this.array && this.startX){
        for (let i = 0; i < this.array.length; i ++){
            this.ctx.clearRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, toPixelHeight(this.array[i].value));
        }
    }

    // Dynamically computes starting position
    this.array = array;
    this.startX = Math.floor((this.ctx.canvas.width - (this.width + this.gap) * this.array.length  ) / 2);

    // Draws the new array on the canvas
    for (let i = 0; i < this.array.length; i ++){
        this.ctx.save();
        this.ctx.fillStyle = this.array[i].color;
        this.ctx.fillRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, toPixelHeight(this.array[i].value));
        this.ctx.restore();
    }
}

/**
 * Take in a delta, and apply all the changes to this.array. Then, clear any previous sorting array in this ArrayView, then display it in the canvas.
 * @param {Array} delta 
 */
ArrayView.prototype.pushDelta = function(delta){
    for (let eDelta of delta){
        let i = eDelta.index;
        if (i < this.array.length){
            // Clears the existing element on the canvas
            this.ctx.clearRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, toPixelHeight(this.array[i].value));
            
            // Update the element
            if ("toColor" in eDelta){
                this.array[i].color = eDelta.toColor;
            }
            if ("toValue" in eDelta){
                this.array[i].value = eDelta.toValue;
            }

            // Draws the new updated element on the canvas
            this.ctx.save();
            this.ctx.fillStyle = this.array[i].color;
            this.ctx.fillRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, toPixelHeight(this.array[i].value));
            this.ctx.restore();
        }
    }
}



/**
 * Simulate bubble sort on a sorting array, and output a list of deltas.
 * @param {Array} array  A sorting array, whose elements all have the 'unsorted' color.
 */
function bubbleSort(array){
    array = JSON.parse(JSON.stringify(array));

    const deltas = [];
    for (let i = 0; i < array.length - 1; i ++){
        let j = array.length - 2; 
        while (j >= i){
            let highlight_compared = [
                {index: j, fromColor: array[j].color, toColor: COLOR.COMPARE}, 
                {index: j+1, fromColor: array[j + 1].color, toColor: COLOR.COMPARE}
            ];
            deltas.push(highlight_compared);

            array[j].color = COLOR.COMPARE;
            array[j + 1].color = COLOR.COMPARE;

            if (array[j].value > array[j + 1].value){
                let highlight_swapped = [
                    {index: j, fromColor: array[j].color, toColor: COLOR.SWAP, fromValue: array[j].value, toValue: array[j + 1].value}, 
                    {index: j+1, fromColor: array[j + 1].color, toColor: COLOR.SWAP, fromValue: array[j+1].value, toValue: array[j].value}
                ];
                deltas.push(highlight_swapped);

                let tmp = array[j].value;
                array[j].value = array[j + 1].value;
                array[j + 1].value = tmp;

                array[j].color = COLOR.SWAP;
                array[j + 1].color = COLOR.SWAP;
            }
            
            // This undo both the swapped and compared highlight.
            let unhighlight = [
                {index: j, fromColor: array[j].color, toColor: COLOR.UNSORTED}, 
                {index: j+1, fromColor: array[j+1].color, toColor: COLOR.UNSORTED}
            ];
            deltas.push(unhighlight);

            array[j].color = COLOR.UNSORTED;
            array[j+1].color = COLOR.UNSORTED;

            j--;
        }

        let highlight_sorted = [
            {index: i, fromColor: array[i].color, toColor: COLOR.SORTED}
        ];
        deltas.push(highlight_sorted);

        array[i].color = COLOR.SORTED;
    }

    let highlight_sorted = [
        {index: array.length - 1, fromColor: array[array.length - 1].color, toColor: COLOR.SORTED}
    ];
    deltas.push(highlight_sorted);
    array[array.length - 1].color = COLOR.SORTED;

    return deltas;
}

function testSorting(sort){
    const test1 = []
    for (var i = 0; i < 100; i ++){
        test1.push(Math.floor(Math.random()*100));
    }
    const test2 = test1.slice();
    sort(test2, 0, test2.length);
    test1.sort(function(a, b){return a - b});
    console.log(test1)
    console.log(test2)
    console.log(JSON.stringify(test1) === JSON.stringify(test2));
}


/**
 * Simulate quick sort on a sorting array, and output a list of deltas.
 * @param {Array} array  A sorting array, whose elements all have the 'unsorted' color.
 */
function quickSort(array){
    function quickSortHelper(array, l, r, deltas){
        if (r - l === 1){
            let highlight_sorted = [
                {index: l, fromColor: array[l].color, toColor: COLOR.SORTED}
            ];
            deltas.push(highlight_sorted);
            
        }else if ( !(r - l < 2)){
            var pivot = array[r - 1].value;
            var i = l;
            
            for (let j = l; j < r - 1; j ++){
                let highlight_compared = [
                    {index: r-1, fromColor: array[r-1].color, toColor: COLOR.COMPARE}, 
                    {index: j, fromColor: array[j].color, toColor: COLOR.COMPARE}
                ];
                deltas.push(highlight_compared);
                
                // This stores the info needed to dehighlight both the swapped elements (if there is one) and the compared elements.
                let dehighlight = [];
    
                if (array[j].value <= pivot){
                    let highlight_swapped = [
                        {index: i, fromValue: array[i].value, toValue: array[j].value, fromColor: array[i].color, toColor: COLOR.SWAP}, 
                        {index: j, fromValue: array[j].value, toValue: array[i].value, fromColor: array[j].color, toColor: COLOR.SWAP}
                    ];
                    deltas.push(highlight_swapped);
    
                    let tmp = array[i].value;
                    array[i].value = array[j].value
                    array[j].value = tmp;
    
                    dehighlight.push({index: i, fromColor: array[i].color, toColor: COLOR.UNSORTED});
                    // dehighlight.push({index: j, fromColor: array[j].color, toColor: COLOR.UNSORTED});
                    
                    i ++;
                }
    
                dehighlight.push({index: r-1, fromColor: array[r-1].color, toColor: COLOR.UNSORTED});
                dehighlight.push({index: j, fromColor: array[j].color, toColor: COLOR.UNSORTED});
                deltas.push(dehighlight);
    
            }
            let highlight_swapped = [
                {index: i, fromValue:array[i].value, toValue: array[r-1].value, fromColor: array[i].color, toColor: COLOR.SWAP},
                {index: r-1, fromValue: array[r-1].value, toValue:array[i].value, fromColor: array[r-1].color, toColor: COLOR.SWAP}
            ];
            deltas.push(highlight_swapped);
    
            
            let tmp = array[i].value;
            array[i].value = pivot;
            array[r - 1].value = tmp
            
            array[i].value = COLOR.SORTED;
            
            let dehighlight_swapped = [
                {index: i, fromColor: array[i].color, toColor: COLOR.UNSORTED},
                {index: r-1, fromColor: array[r-1].color, toColor: COLOR.UNSORTED},
            ];
            deltas.push(dehighlight_swapped);
    
            let highlight_sorted = [
                {index: i, fromColor: array[i].color, toColor: COLOR.SORTED},
            ];
            deltas.push(highlight_sorted);
    
            quickSortHelper(array, l, i, deltas);
            quickSortHelper(array, i + 1, r, deltas);
        }
    }

    let deltas = [];
    array = JSON.parse(JSON.stringify(array));
    quickSortHelper(array, 0, array.length, deltas);
    return deltas;
}



/**
 * Simulate insertion sort on a sorting array, and output a list of deltas.
 * @param {Array} array  A sorting array, whose elements all have the 'unsorted' color.
 */
function insertionSort(array){
    array = JSON.parse(JSON.stringify(array));
    var deltas = [];

    for (let i = 0; i < array.length; i++){
        let j = i;

        while (j > 0 && array[j].value < array[j - 1].value){
            let highlight_compared = [
                {index: j, fromColor: array[j].color, toColor: COLOR.COMPARE},
                {index: j-1, fromColor: array[j-1].color, toColor:COLOR.COMPARE}
            ];
            deltas.push(highlight_compared);

            let highlight_swapped = [
                {index: j, fromColor: COLOR.COMPARE, toColor: COLOR.SWAP, fromValue: array[j].value, toValue: array[j - 1].value},
                {index: j-1, fromColor: COLOR.COMPARE, toColor:COLOR.SWAP, fromValue: array[j-1].value, toValue: array[j].value}
            ];
            deltas.push(highlight_swapped);
            
            let dehighlight = [
                {index: j, fromColor: COLOR.SWAP, toColor: COLOR.SORTED},
                {index: j-1, fromColor: COLOR.SWAP, toColor: COLOR.UNSORTED}
            ];
            deltas.push(dehighlight);


            let tmp = array[j-1].value;
            array[j-1].value = array[j].value;
            array[j].value = tmp;
            
            j--;
        }

        let highlight_sorted = [
            {index: j, fromColor: COLOR.UNSORTED, toColor: COLOR.SORTED},
        ];
        deltas.push(highlight_sorted);

        array[j].color = COLOR.SORTED;

    }
    return deltas;
}

/**
 * Simulate merge sort on a sorting array, and output a list of deltas.
 * @param {Array} array  A sorting array, whose elements all have the 'unsorted' color.
 */
function mergeSort(array){
    function mergeSortHelper(array, l, r, deltas){
        if ((r - l) >= 2){
            const mid = l + Math.floor((r-l) / 2);
            mergeSortHelper(array, l, mid, deltas);
            mergeSortHelper(array, mid, r, deltas);
            merge(array, l, mid, r, deltas);
        }
    }

    function merge(array, l, m, r, deltas){
        let p = l;
        let q = m;
        let i = l;

        // batch holds the animation of changing array[l:r] to new_array[:].
        let batch = [];
        let new_array = [];

        while (p < m && q < r){
            if (array[p].value < array[q].value){
                
                let animation = [
                    {index: i, fromValue: array[i].value, toValue: array[p].value}
                ];
                batch.push(animation);
    
                let hightlight = [
                    {index: p, fromColor: array[p].color, toColor: COLOR.HIGHLIGHT}
                ];
                deltas.push(hightlight);
    
                let dehightlight = [
                    {index: p, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
                ];
                deltas.push(dehightlight);
    
                array[p].color = COLOR.PARTIALLY_SORTED;
    
                new_array.push(array[p]);
                p++;
                i++;
            }else{
                let animation = [
                    {index: i, fromValue: array[i].value, toValue: array[q].value}
                ];
                batch.push(animation);
    
                let hightlight = [
                    {index: q, fromColor: array[q].color, toColor: COLOR.HIGHLIGHT}
                ];
                deltas.push(hightlight);
    
                let dehightlight = [
                    {index: q, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
                ];
                deltas.push(dehightlight);
    
                array[q].color = COLOR.PARTIALLY_SORTED;
    
                new_array.push(array[q]);
                q++;
                i++;
            }
        }
    
        if (p == m){
            while (q < r){
                let animation = [
                    {index: i, fromValue: array[i].value, toValue: array[q].value}
                ];
                batch.push(animation);
                
                let hightlight = [
                    {index: q, fromColor: array[q].color, toColor: COLOR.HIGHLIGHT}
                ];
                deltas.push(hightlight);
    
                let dehightlight = [
                    {index: q, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
                ];
                deltas.push(dehightlight);
    
                array[q].color = COLOR.PARTIALLY_SORTED;
    
                new_array.push(array[q]);
                q++;
                i++;
            }
        }else if (q == r){
            while (p < m){
                let animation = [
                    {index: i, fromValue: array[i].value, toValue: array[p].value}
                ];
                batch.push(animation);
    
                let hightlight = [
                    {index: p, fromColor: array[p].color, toColor: COLOR.HIGHLIGHT}
                ];
                deltas.push(hightlight);
    
                let dehightlight = [
                    {index: p, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
                ];
                deltas.push(dehightlight);
    
                array[p].color = COLOR.PARTIALLY_SORTED;
    
                new_array.push(array[p]);
                p++;
                i++;
            }
        }
    
        for (let j = 0; j < new_array.length; j++){
            array[l+j] = new_array[j];
        }
    
        for (let j = 0; j < batch.length; j++){
            deltas.push(batch[j]);
        }
    }

    array = JSON.parse(JSON.stringify(array));
    var deltas = [];
    mergeSortHelper(array, 0, array.length, deltas);
    
    for (let i = 0; i < array.length; i++){
        let sorted = [{index: i, fromColor: array[i].color, toColor: COLOR.SORTED}];
        deltas.push(sorted);
    }
    return deltas;
}



/**
 * Given a sorting array's length, attempt to calculate the pixel-width of each array element (bar), and the pixel-width of the in-between gaps.
 * @param {number} len the sorting array's length
 */
function calcWidth(len){
    // Strategy here is to make width as large as possible, and maintain a 1 to 4 width to gap ratio. If that doesn't work, iteratively decrease them in a while loop.
    
    var width = Math.floor(MAX_ARRAY_WIDTH * ctx.canvas.width / len)
    var gap = Math.floor(width/4);
    var total_width = len * (gap + width);
    while (total_width > MAX_ARRAY_WIDTH * ctx.canvas.width){
        width = width - 1;
        gap = Math.max(Math.floor(width/4), 0);
        total_width = len * (gap + width);
    }

    return {width: width, gap: gap};

}

/**
 * Given a sorting array's element value, convert it to pixel-height.
 * @param {number} val a number from 0 to NORMALIZING_CONSTANT
 */
function toPixelHeight(val){
    return Math.floor(ctx.canvas.height * MAX_ARRAY_HEIGHT * val/NORMALIZING_CONSTANT);
}


/**
 * On window resize, dynamically adjust canvas width and height. Also dynamically compute new width and gap, clear the canvas, then update array view.
 */
window.addEventListener('resize', function(){
    var root = document.querySelector('html');
    canvas.width = root.clientWidth;
    canvas.height = root.clientHeight - document.querySelector('.header').offsetHeight;
    var width = calcWidth(ARRAY_LEN).width;
    var gap = calcWidth(ARRAY_LEN).gap;
    vis.arrayView.width = width;
    vis.arrayView.gap = gap;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Note that setArray itself does some clearing, which is redundant work.
    vis.arrayView.setArray(vis.arrayView.array);
})


var width = calcWidth(ARRAY_LEN).width;
var gap = calcWidth(ARRAY_LEN).gap;

var view = new ArrayView(ctx, 0, width, gap);
// Since bubble sort is selected on the UI by default, set the sorting alg to bubblesort.
var vis = new Visualizer(ARRAY_LEN, NORMALIZING_CONSTANT, view, bubbleSort);