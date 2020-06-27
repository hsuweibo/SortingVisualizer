const algSelect = document.getElementById("algSelect");
const btnReset = document.getElementById("reset");

const btnPlay = document.getElementById("play");
const btnStop = document.getElementById("stop");



btnReset.addEventListener('click', function(){
    vis.setRandomArray(vis.length, vis.range);
});

btnStop.addEventListener('click', function(){
    vis.stopAnimation();
    btnPlay.textContent = "Play";
});


btnPlay.addEventListener('click', function(){
    if (vis.paused){
        vis.playAnimation(10);
        btnPlay.textContent = "Pause";
    }else{
        vis.pauseAnimation();
        btnPlay.textContent = "Play";
    }
});


algSelect.addEventListener('change', function(){
    let alg = algSelect.value;
    let copied = JSON.parse(JSON.stringify(vis.initArray));
    if (alg === 'bubble'){
        vis.deltas = bubbleSort(copied);
    }else if (alg === 'quick'){
        vis.deltas = quickSort(copied);
    }else if (alg === 'merge'){
        vis.deltas = mergeSort(copied);
    }else if (alg === 'insertion'){
        vis.deltas = insertionSort(copied);
    }
    vis.deltasIndex = 0;
})

const canvas = document.getElementById("cv");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');




// Refactoring//
const COLOR = {SWAP: 'red', COMPARE: 'green', UNSORTED: 'grey', SORTED: 'DarkSeaGreen', HIGHLIGHT: 'orange', PARTIALLY_SORTED: 'CadetBlue'};

function Visualizer(length, range, view, alg){
    this.sortingAlg = alg;
    this.animationId = undefined;
    this.paused = true;
    this.initArray = undefined;
    this.arrayView = view;
    this.deltas = undefined;
    this.deltasIndex = undefined;
    this.length = length;
    this.range = range;

    this.setRandomArray(length, range);
}

Visualizer.prototype.changeAlgorithm = function(alg){
    if (alg !== this.sortingAlg){
        this.sortingAlg = alg;
        this.deltas = this.sortingAlg(JSON.parse(JSON.stringify(this.initArray)));
        this.deltasIndex = 0;
    }
}


Visualizer.prototype.setRandomArray = function(length, range){
    this.initArray = [];
    for (let i = 0; i < length; i ++){
        let val = Math.floor(Math.random() * range) + 1;
        let element = {value: val, color: COLOR.UNSORTED};
        this.initArray.push(element);
    }

    this.arrayView.setArray(JSON.parse(JSON.stringify(this.initArray)));
    this.deltas = this.sortingAlg(JSON.parse(JSON.stringify(this.initArray)));
    this.deltasIndex = 0;

    algSelect.removeAttribute('disabled');

}

Visualizer.prototype.playAnimation = function(time){
    btnReset.setAttribute('disabled', '');
    algSelect.setAttribute('disabled', '');
    // btnPause.removeAttribute('disabled');

    btnStop.removeAttribute('disabled');

    this.paused = false;

    function update(){
        console.log(this.deltas.length - 1 - this.deltasIndex);
        if (this.deltasIndex < this.deltas.length){
            let delta = this.deltas[this.deltasIndex];
            this.arrayView.pushDelta(delta);
            this.deltasIndex++;
        }else{
            clearInterval(this.animationId);
            this.paused = true;

            this.deltasIndex = 0;
            
            btnReset.removeAttribute('disabled');
            algSelect.removeAttribute('disabled');
            btnPlay.textContent = 'Play';
        }
    }
    const boundUpdate = update.bind(this);
    this.animationId = setInterval(boundUpdate, time);
}


Visualizer.prototype.stopAnimation = function(){
    clearInterval(this.animationId);
    this.paused = true;

    this.deltasIndex = 0;
    this.arrayView.setArray(JSON.parse(JSON.stringify(this.initArray)));

    btnReset.removeAttribute('disabled');
    algSelect.removeAttribute('disabled');
}

Visualizer.prototype.pauseAnimation = function(){
    clearInterval(this.animationId);
    this.paused = true;

    btnReset.removeAttribute('disabled');
}

Visualizer.prototype.playNextFrame = function(){
    if (this.deltasIndex < this.deltas.length){
        let delta = this.deltas[this.deltasIndex];
        this.arrayView.pushDelta(delta);
        this.deltasIndex++;
    }
}

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






function ArrayView(ctx, baselineY, width, gap){
    this.baselineY = baselineY;
    this.width = width;
    this.gap = gap;
    this.ctx = ctx;

    this.array = undefined;
    this.startX = undefined;
}

ArrayView.prototype.setArray = function(array){
    // Clears the existing array on the canvas.
    if (this.array && this.startX){
        for (let i = 0; i < this.array.length; i ++){
            this.ctx.clearRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, this.array[i].value);
        }
    }

    // Dynamically computes starting position
    this.array = array;
    this.startX = Math.floor((this.ctx.canvas.width - (this.width + this.gap) * this.array.length  ) / 2);

    // Draws the new array on the canvas
    for (let i = 0; i < this.array.length; i ++){
        this.ctx.save();
        this.ctx.fillStyle = this.array[i].color;
        this.ctx.fillRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, this.array[i].value);
        this.ctx.restore();
    }
}

ArrayView.prototype.pushDelta = function(delta){
    for (let eDelta of delta){
        let i = eDelta.index;
        if (i < this.array.length){
            // Clears the existing element on the canvas
            this.ctx.clearRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, this.array[i].value);
            
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
            this.ctx.fillRect(this.startX + (i * (this.width + this.gap)), this.baselineY, this.width, this.array[i].value);
            this.ctx.restore();
        }
    }
}





function bubbleSort(array){
    const deltas = [];
    var d;
    for (let i = 0; i < array.length - 1; i ++){
        let j = array.length - 2; 
        while (j >= i){
            d = [
                {index: j, fromColor: array[j].color, toColor: COLOR.COMPARE}, 
                {index: j+1, fromColor: array[j + 1].color, toColor: COLOR.COMPARE}
            ];
            deltas.push(d);

            array[j].color = COLOR.COMPARE;
            array[j + 1].color = COLOR.COMPARE;

            if (array[j].value > array[j + 1].value){
                let d = [
                    {index: j, fromColor: array[j].color, toColor: COLOR.SWAP, fromValue: array[j].value, toValue: array[j + 1].value}, 
                    {index: j+1, fromColor: array[j + 1].color, toColor: COLOR.SWAP, fromValue: array[j+1].value, toValue: array[j].value}
                ];
                deltas.push(d);

                let tmp = array[j].value;
                array[j].value = array[j + 1].value;
                array[j + 1].value = tmp;

                array[j].color = COLOR.SWAP;
                array[j + 1].color = COLOR.SWAP;
            }

            d = [
                {index: j, fromColor: array[j].color, toColor: COLOR.UNSORTED}, 
                {index: j+1, fromColor: array[j+1].color, toColor: COLOR.UNSORTED}
            ];
            deltas.push(d);

            array[j].color = COLOR.UNSORTED;
            array[j+1].color = COLOR.UNSORTED;

            j--;
        }

        d = [
            {index: i, fromColor: array[i].color, toColor: COLOR.SORTED}
        ];
        deltas.push(d);

        array[i].color = COLOR.SORTED;
    }

    d = [
        {index: array.length - 1, fromColor: array[array.length - 1].color, toColor: COLOR.SORTED}
    ];
    deltas.push(d);
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


function quickSort(array){
    deltas = [];
    quickSortHelper(array, 0, array.length, deltas);
    return deltas;
}

function quickSortHelper(array, l, r, deltas){
    var d;
    if (r - l === 1){
        d = [
            {index: l, fromColor: array[l].color, toColor: COLOR.SORTED}
        ];
        deltas.push(d);
        
    }else if ( !(r - l < 2)){
        var pivot = array[r - 1].value;
        var i = l;
        
        for (let j = l; j < r - 1; j ++){
            d = [
                {index: r-1, fromColor: array[r-1].color, toColor: COLOR.COMPARE}, 
                {index: j, fromColor: array[j].color, toColor: COLOR.COMPARE}
            ];
            deltas.push(d);

            let dUncolor = [];

            if (array[j].value <= pivot){
                d = [
                    {index: i, fromValue: array[i].value, toValue: array[j].value, fromColor: array[i].color, toColor: COLOR.SWAP}, 
                    {index: j, fromValue: array[j].value, toValue: array[i].value, fromColor: array[j].color, toColor: COLOR.SWAP}
                ];
                deltas.push(d);

                let tmp = array[i].value;
                array[i].value = array[j].value
                array[j].value = tmp;

                dUncolor.push({index: i, fromColor: array[i].color, toColor: COLOR.UNSORTED})
                // dUncolor.push({index: j, fromColor: array[j].color, toColor: COLOR.UNSORTED});
                
                i ++;
            }

            dUncolor.push({index: r-1, fromColor: array[r-1].color, toColor: COLOR.UNSORTED});
            dUncolor.push({index: j, fromColor: array[j].color, toColor: COLOR.UNSORTED});
            deltas.push(dUncolor);

        }
        d = [
            {index: i, fromValue:array[i].value, toValue: array[r-1].value, fromColor: array[i].color, toColor: COLOR.SWAP},
            {index: r-1, fromValue: array[r-1].value, toValue:array[i].value, fromColor: array[r-1].color, toColor: COLOR.SWAP}
        ];
        deltas.push(d);

        
        let tmp = array[i].value;
        array[i].value = pivot;
        array[r - 1].value = tmp
        
        array[i].value = COLOR.SORTED;
        
        d = [
            {index: i, fromColor: array[i].color, toColor: COLOR.UNSORTED},
            {index: r-1, fromColor: array[r-1].color, toColor: COLOR.UNSORTED},
        ];
        deltas.push(d);

        d = [
            {index: i, fromColor: array[i].color, toColor: COLOR.SORTED},
        ];
        deltas.push(d);

        quickSortHelper(array, l, i, deltas);
        quickSortHelper(array, i + 1, r, deltas);
    }
}


function insertionSort(array){
    var deltas = [];
    for (let i = 0; i < array.length; i++){
        let j = i;

        while (j > 0 && array[j].value < array[j - 1].value){
            let compare = [
                {index: j, fromColor: array[j].color, toColor: COLOR.COMPARE},
                {index: j-1, fromColor: array[j-1].color, toColor:COLOR.COMPARE}
            ];
            deltas.push(compare);

            let swap = [
                {index: j, fromColor: COLOR.COMPARE, toColor: COLOR.SWAP, fromValue: array[j].value, toValue: array[j - 1].value},
                {index: j-1, fromColor: COLOR.COMPARE, toColor:COLOR.SWAP, fromValue: array[j-1].value, toValue: array[j].value}
            ];
            deltas.push(swap);
            
            let uncolor = [
                {index: j, fromColor: COLOR.SWAP, toColor: COLOR.SORTED},
                {index: j-1, fromColor: COLOR.SWAP, toColor: COLOR.UNSORTED}
            ];
            deltas.push(uncolor);


            let tmp = array[j-1].value;
            array[j-1].value = array[j].value;
            array[j].value = tmp;
            
            j--;
        }

        let newly_sorted = [
            {index: j, fromColor: COLOR.UNSORTED, toColor: COLOR.SORTED},
        ];
        deltas.push(newly_sorted);

        array[j].color = COLOR.SORTED;

    }
    return deltas;
}


function mergeSort(array){
    var deltas = [];
    mergeSortHelper(array, 0, array.length, deltas);

    for (let i = 0; i < array.length; i++){
        let sorted = [{index: i, fromColor: array[i].color, toColor: COLOR.SORTED}];
        deltas.push(sorted);
    }
    return deltas;
}

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

            let unhightlight = [
                {index: p, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
            ];
            deltas.push(unhightlight);

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

            let unhightlight = [
                {index: q, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
            ];
            deltas.push(unhightlight);

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

            let unhightlight = [
                {index: q, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
            ];
            deltas.push(unhightlight);

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

            let unhightlight = [
                {index: p, fromColor: COLOR.HIGHLIGHT, toColor: COLOR.PARTIALLY_SORTED}
            ];
            deltas.push(unhightlight);

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

var view = new ArrayView(ctx, 0, 10, 5);
var vis = new Visualizer(80, 800, view, bubbleSort);


// vis.deltas = mergeSort(vis.initArray);
// vis.playAnimation(10);
// var array = [
//     {value: 16, color: COLOR.UNSORTED},
//     {value: 22, color: COLOR.UNSORTED},
//     {value: 34, color: COLOR.UNSORTED},
//     {value: 67, color: COLOR.UNSORTED},
//     {value: 77, color: COLOR.UNSORTED},

//     {value: 4, color: COLOR.UNSORTED},
//     {value: 15, color: COLOR.UNSORTED},
//     {value: 55, color: COLOR.UNSORTED},
//     {value: 80, color: COLOR.UNSORTED},
//     {value: 90, color: COLOR.UNSORTED}
// ]

// var deltas = []
// merge(array, 0, 5, 10, deltas);

