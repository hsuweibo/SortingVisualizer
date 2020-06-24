const btnBubble = document.getElementById("bubble");
const btnReset = document.getElementById("reset");
const btnQuick = document.getElementById("quick");
const btnPause = document.getElementById("pause");
const btnPlay = document.getElementById("play");
const btnStop = document.getElementById("stop");


btnBubble.addEventListener('click', function(){
    vis.deltas = bubbleSort(JSON.parse(JSON.stringify(vis.initArray)));
});

btnReset.addEventListener('click', function(){
    vis.setRandomArray(vis.length, vis.range);
});

btnStop.addEventListener('click', function(){
    vis.stopAnimation();
});

btnQuick.addEventListener('click', function(){
    vis.deltas = quickSort(JSON.parse(JSON.stringify(vis.initArray)));
    vis.deltasIndex = 0;
});

btnPause.addEventListener('click', function(){
    vis.pauseAnimation();
});

btnPlay.addEventListener('click', function(){
    vis.playAnimation(10);
});

const canvas = document.getElementById("cv");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');




// Refactoring//
const COLOR = {SWAP: 'red', COMPARE: 'green', UNSORTED: 'grey', SORTED: 'purple'};

function Visualizer(length, range, view){
    this.animationId = undefined;
    this.initArray = undefined;
    this.arrayView = view;
    this.deltas = undefined;
    this.deltasIndex = undefined;
    this.length = length;
    this.range = range;

    this.setRandomArray(length, range);
}

Visualizer.prototype.playAnimation = function(time){
    btnReset.setAttribute('disabled', '');
    btnBubble.setAttribute('disabled', '');
    btnQuick.setAttribute('disabled', '');

    function update(){
        console.log(this.deltas.length - 1 - this.deltasIndex);
        if (this.deltasIndex < this.deltas.length){
            let delta = this.deltas[this.deltasIndex];
            this.arrayView.pushDelta(delta);
            this.deltasIndex++;
        }else{
            clearInterval(this.animationId);
            btnReset.removeAttribute('disabled');
            btnBubble.removeAttribute('disabled');
            btnQuick.removeAttribute('disabled');
        }
    }
    const boundUpdate = update.bind(this);
    this.animationId = setInterval(boundUpdate, time);
}

Visualizer.prototype.setRandomArray = function(length, range){
    this.initArray = [];
    for (let i = 0; i < length; i ++){
        let val = Math.floor(Math.random() * range) + 1;
        let element = {value: val, color: COLOR.UNSORTED};
        this.initArray.push(element);
    }

    this.arrayView.setArray(JSON.parse(JSON.stringify(this.initArray)));
    this.deltas = [];
    this.deltasIndex = 0;

    btnBubble.removeAttribute('disabled');
    btnQuick.removeAttribute('disabled');
}

Visualizer.prototype.stopAnimation = function(){
    clearInterval(this.animationId);
    this.deltasIndex = 0;
    this.arrayView.setArray(JSON.parse(JSON.stringify(this.initArray)));

    btnReset.removeAttribute('disabled');
    btnBubble.removeAttribute('disabled');
    btnQuick.removeAttribute('disabled');
}

Visualizer.prototype.pauseAnimation = function(){
    clearInterval(this.animationId);

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

var view = new ArrayView(ctx, 0, 10, 5);
var vis = new Visualizer(80, 800, view);



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

function testSorting(){
    const test1 = []
    for (var i = 0; i < 100; i ++){
        test1.push(Math.floor(Math.random()*100));
    }
    const test2 = test1.slice();
    quickSort(test2, 0, test2.length);
    test1.sort(function(a,b){return a - b});
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