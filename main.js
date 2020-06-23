const btnBubble = document.getElementById("bubble");
const btnReset = document.getElementById("reset");
const btnQuick = document.getElementById("quick");
const btnPause = document.getElementById("pause");
const btnPlay = document.getElementById("play");
const btnStop = document.getElementById("stop");

const SORTED = 'purple';
const COMP = 'green';
const SWAP = 'red';
const UNSORTED = 'grey';

btnBubble.addEventListener('click', function(){
    ab.animationSeq = bubbleSort(ab.toArray());
});

btnReset.addEventListener('click', function(){
    ab.clear(ctx);
    ab.initRandomArray();
    ab.draw(ctx);
    ab.animationSeq = [];
    ab.animationId = null;
});

btnStop.addEventListener('click', function(){
    ab.animationSeq = [];
    clearInterval(ab.animationId);
    ab.animationId = null;
    ab.draw(ctx);
    btnReset.removeAttribute('disabled');
    btnBubble.removeAttribute('disabled');
    btnQuick.removeAttribute('disabled');
});

btnQuick.addEventListener('click', function(){
    ab.animationSeq = quickSort(ab.toArray());
});

btnPause.addEventListener('click', function(){
    clearInterval(ab.animationId);
});

btnPlay.addEventListener('click', function(){
    btnReset.setAttribute('disabled', '');
    btnBubble.setAttribute('disabled', '');
    btnQuick.setAttribute('disabled', '');
    ab.playAnimation(10);
});

const canvas = document.getElementById("cv");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

function Bar(x, y, width, height, color){
    this.color = color;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Bar.prototype.draw = function(ctx){
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
}

Bar.prototype.clear = function (ctx){
    ctx.save();
    ctx.clearRect(this.x, this.y, this.width, this.height);
    ctx.restore();
}

Bar.prototype.setProperties = function(bp){
    this.color = bp.color;
    this.height = bp.height;
}

function BarProperties(height, color){
    this.height = height;
    this.color = color;
}


function ArrayBar(size, range, width, gap){
    this.range = range;
    this.size = size;
    this.width = width;
    this.gap = gap;
    this.bars = [];
    this.initRandomArray();
    this.animationSeq = [];
    this.animationId = null;
}


ArrayBar.prototype.initRandomArray = function(){
    const startx = Math.floor((canvas.width - (this.width + this.gap) * this.size) / 2);
    this.bars = [];
    for (let i = 0; i < this.size; i++) {
         let height = Math.floor(Math.random() * this.range);
         let x = startx + i * (this.width + this.gap);
         let y = 0;
         let bar = new Bar(x, y, this.width, height, UNSORTED);
         this.bars.push(bar);
    }
}


ArrayBar.prototype.addAnimationSeq = function (changes){
    this.animationSeq.push(changes);
}

ArrayBar.prototype.draw = function (ctx){
    for (const bar of this.bars) {
        bar.draw(ctx);
    }
}

ArrayBar.prototype.clear = function (ctx){
    for (const bar of this.bars) {
        bar.clear(ctx);
    }
}

ArrayBar.prototype.playAnimation = function(time){
    function update(){
        console.log(this.animationSeq.length);
        if (this.animationSeq.length > 0){
            let changes = this.animationSeq.shift();
            for (const prop in changes){
                if (changes.hasOwnProperty(prop)){
                    let index = prop.toString();
                    let bar = this.bars[index];
                    bar.clear(ctx);
                    bar.setProperties(changes[index]);
                    bar.draw(ctx);
                }
            }
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

ArrayBar.prototype.toArray = function(){
    const array = [];
    for (let i = 0; i < this.bars.length; i++){
        array.push(this.bars[i].height);
    }
    return array;
}

function bubbleSort(array){
    const animationSeq = []
    for (let i = 0; i < array.length - 1; i ++){
        let j = array.length - 2; 
        while (j >= i){

            let compare_color = {
                [j]: new BarProperties(array[j], COMP), 
                [j+1]: new BarProperties(array[j + 1], COMP)
            };
            animationSeq.push(compare_color);

            if (array[j] > array[j + 1]){
                let tmp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = tmp;
                
                
                
                let swap_color = {
                    [j]: new BarProperties(array[j], SWAP), 
                    [j+1]: new BarProperties(array[j+1], SWAP)
                }



                animationSeq.push(swap_color);
            }

            let compare_uncolor = {
                [j]: new BarProperties(array[j], UNSORTED), 
                [j+1]: new BarProperties(array[j + 1], UNSORTED)
            };
            animationSeq.push(compare_uncolor);
            j--;
        }

        let color_sorted = {
            [i]: new BarProperties(array[j + 1], SORTED)
        };
        animationSeq.push(color_sorted);
    }

    let last_sorted = {
        [array.length - 1]: new BarProperties(array[array.length - 1], SORTED)
    };
    animationSeq.push(last_sorted);

    return animationSeq;
}

function quickSort(array){
    animationSeq = [];
    quickSortHelper(array, 0, array.length, animationSeq);
    return animationSeq;
}

function quickSortHelper(array, l, r, animationSeq){
    if (r - l === 1){
        let color_sorted = {
            [l]: new BarProperties(array[l], SORTED)
        };
        animationSeq.push(color_sorted);
    }else if ( !(r - l < 2)){
        var pivot = array[r - 1];
        var i = l;
        
        for (let j = l; j < r - 1; j ++){
            let compare_color = {
                [r-1]: new BarProperties(array[r-1], COMP), 
                [j]: new BarProperties(array[j], COMP)
            };
            
            let compare_uncolor = {
                [r-1]: new BarProperties(array[r-1], UNSORTED), 
                [j]: new BarProperties(array[j], UNSORTED)
            };
            animationSeq.push(compare_color);
            animationSeq.push(compare_uncolor)

            if (array[j] <= pivot){
                
                let tmp = array[i];
                array[i] = array[j]
                array[j] = tmp;
                
                let swap_color = {
                    [i]: new BarProperties(array[i], SWAP), 
                    [j]: new BarProperties(array[j], SWAP)
                };
                let swap_uncolor = {
                    [i]: new BarProperties(array[i], UNSORTED), 
                    [j]: new BarProperties(array[j], UNSORTED)
                };
                animationSeq.push(swap_color);
                animationSeq.push(swap_uncolor);
                
                i ++;
            }

        }
        let tmp = array[i];
        array[i] = pivot;
        array[r - 1] = tmp

        let color_sorted = {
            [i]: new BarProperties(array[i], SORTED)
        };
        animationSeq.push(color_sorted);
        
        quickSortHelper(array, l, i, animationSeq);
        quickSortHelper(array, i + 1, r, animationSeq);
    }
}


const ab = new ArrayBar(50, 800, 10, 2);
ab.draw(ctx);

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

