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

function ArrayBar(size, range, width, gap){
    this.range = range;
    this.size = size;
    this.width = width;
    this.gap = gap;
    this.bars = [];
    this.initRandomArray();
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

ArrayBar.prototype.draw = function (ctx){
    for (const bar of this.bars) {
        bar.draw(ctx);
    }
}


const test = new ArrayBar(20, 500, 30, 5);
test.draw(ctx);



