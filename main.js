const btnBubble = document.getElementById("bubble");
const btnReset = document.getElementById("reset");

btnBubble.addEventListener('click', function(){
    ab.animationSeq = bubbleSort(ab.toArray());
    ab.playAnimation();
})

btnReset.addEventListener('click', function(){
    ab.clear(ctx);
    ab.initRandomArray();
    ab.draw(ctx);
    ab.animationSeq = [];
})

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
}


ArrayBar.prototype.initRandomArray = function(){
    const startx = Math.floor((canvas.width - (this.width + this.gap) * this.size) / 2);
    this.bars = [];
    for (let i = 0; i < this.size; i++) {
         let height = Math.floor(Math.random() * this.range);
         let x = startx + i * (this.width + this.gap);
         let y = 0;
         let bar = new Bar(x, y, this.width, height, 'grey');
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

ArrayBar.prototype.playAnimation = function(){
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
            // setTimeout(boundUpdate, 0.01);
        }else{
            clearInterval(animationId);
        }
    }
    const boundUpdate = update.bind(this);
    var animationId = setInterval(boundUpdate, 100);
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
                [j]: new BarProperties(array[j], 'green'), 
                [j+1]: new BarProperties(array[j + 1], 'green')
            };
            animationSeq.push(compare_color);

            if (array[j] > array[j + 1]){
                let tmp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = tmp;
                
                
                
                let swap_color = {
                    [j]: new BarProperties(array[j], 'red'), 
                    [j+1]: new BarProperties(array[j+1], 'red')
                }



                animationSeq.push(swap_color);
            }

            let compare_uncolor = {
                [j]: new BarProperties(array[j], 'grey'), 
                [j+1]: new BarProperties(array[j + 1], 'grey')
            };
            animationSeq.push(compare_uncolor);
            j--;
        }

        let color_sorted = {
            [i]: new BarProperties(array[j + 1], 'brown')
        };
        animationSeq.push(color_sorted);
    }

    let last_sorted = {
        [array.length - 1]: new BarProperties(array[array.length - 1], 'brown')
    };
    animationSeq.push(last_sorted);

    return animationSeq;
}


function quickSort(array, l, r){
    if ( !(r - l < 2)){
        var pivot = array[r - 1];
        var i = l;
        
        for (let j = l; j < r - 1; j ++){
            if (array[j] <= pivot){
                let tmp = array[i];
                array[i] = array[j]
                array[j] = tmp;
                i ++;
            }
        }
        let tmp = array[i];
        array[i] = pivot;
        array[r - 1] = tmp
        
        quickSort(array, l, i);
        quickSort(array, i + 1, r);
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

// ab.animationSeq = bubbleSort(ab.toArray());

// ab.playAnimation();

a = [5, 6,2, 8, 1, 2, 6]
a = [2, 1,2, 5, 6, 6, 8]
quickSort(a, 0, 7);