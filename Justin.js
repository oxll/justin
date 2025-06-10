/*
  TODO:
  - anchor coords (top-left, top-right, etc, if prev or next is certain anchor, then don't add point)
  - anchors for opposite-side points
  - better circle-collision and box-collision rendering? (arcs and lines)
  - make fun maze
  - nonaxial/polygon collisions?
*/

let gravity;

let body;
let balls, mouseBall;
let boxes;

let won = false;

function setup() {
  createCanvas(600, 600);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  gravity = createVector(0, 10);
  
  body = new Body(width*0.9, height*0.1, height/7);
  
  balls = [];
  boxes = [];
  
  mouseBall = new MouseBall(width/7);
  balls.push(mouseBall);
  
  addMazeCompoments();
}

function addMazeCompoments() {
  boxes.push(new Row(width*0.8, width, height*0.2));
  boxes.push(new Column(0, height*0.4, width*0.625));
  boxes.push(new Row(width*0.625, width*0.85, height*0.4));
  
  balls.push(new Ball(width, height*0.6, width*0.2));
  balls.push(new Ball(width*0.85, height*0.625, width*0.125));
  balls.push(new Ball(width*0.725, height*0.59, width*0.15));
  balls.push(new Ball(width*0.6, height*0.625, width*0.15));
  
  boxes.push(new Row(width*0.3, width*0.5, height*0.6));
  boxes.push(new Column(height*0.15, height*0.6, width*0.3));
  
  boxes.push(new Row(width*0.475, width*0.625, height*0.4));
  boxes.push(new Row(width*0.3, width*0.45, height*0.2));
  
  for (let i = 0; i < 5; i++) {
    let x = 0;
    let y = height*0.1;
    
    balls.push(new Ball(width*i*0.03 + x,
                        height*i*0.03 + y,
                        width*0.075));
  }
  
  for (let i = 0; i < 5; i++) {
    let x = width*0.15;
    let y = height*0.35;
    
    balls.push(new Ball(width*i*0.03 + x,
                        height*(5-i)*0.03 + y,
                        width*0.075));
  }
  
  for (let i = 0; i < 5; i++) {
    let x = width*0.025;
    let y = height*0.65;
    
    balls.push(new Ball(width*i*0.03 + x,
                        height*i*0.03 + y,
                        width*0.075));
  }
  
  balls.push(new Ball(width*0.275, height*0.825, width*0.125));
  boxes.push(new Row(width*0.175, width*0.8, height*0.825));

  for (let i = 0; i < 25; i++) {
    balls.push(new Ball(width*random(1), height, width*0.05));
  }
}

function getPrevIndex(arr, i) {
  if (i === 0) {
    return arr.length - 1;
  } else {
    return i - 1;
  }
}
  
function getNextIndex(arr, i) {
  if (i === arr.length - 1) {
    return 0;
  } else {
    return i + 1;
  }
}

function getPrev(arr, i) {
  let prevIndex = getPrevIndex(arr, i);
  return arr[prevIndex];
}
  
function getNext(arr, i) {
  let nextIndex = getNextIndex(arr, i);
  return arr[nextIndex];
}


function intersection(a, b, c, d) {
  let alpha = (d.x - c.x) * (c.y - a.y);
  alpha -= (d.y - c.y) * (c.x - a.x);
  
  let beta = (b.x - a.x) * (c.y - a.y);
  beta -= (b.y - a.y) * (c.x - a.x);
  
  let denom = (d.x - c.x) * (b.y - a.y);
  denom -= (d.y - c.y) * (b.x - a.x);
  
  if (denom == 0) {
    return {
      isIntersecting: false,
    };
  }
  
  alpha /= denom;
  beta /= denom;
  
  if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1) {
    return {
      isIntersecting: false,
    };
  }
  
  return {
    isIntersecting: true,
    value: p5.Vector.lerp(a, b, alpha),
  };
}

function isIntersecting(a, b, c, d) {
  return intersection(a, b, c, d).isIntersecting;
}

function getIntersection(a, b, c, d) {
  return intersection(a, b, c, d).value;
}

function draw() {
  update();
  render();
  
  if (won) {
    colorMode(HSB);
    background(random(360), 100, 100);
    colorMode(RGB);
    
    textFont("Roboto", 50);
    fill(255);
    text("you won hooray!", width/2, height*0.45);
    text("happy birthday justin", width/2, height*0.6);
    text("click anywhere to play again", width/2, height*0.9);
  }
}

function mousePressed() {
  if (won) {
    won = false;
    body = new Body(width*0.9, height*0.1, height/7);
  }
}

function update() {
  body.update();
  mouseBall.update();
}

function render() {
  background(50);
  
  renderEndZone();

  body.render();
  renderBalls();
  renderBoxes();
}

function renderBalls() {
  balls.forEach(ball => {
    ball.render();
  });
}

function renderBoxes() {
  boxes.forEach(box => {
    box.render();
  });
}

function renderEndZone() {
  fill(255, 255, 0);
  triangle(0, height*0.65,
           0, height*0.825,
           width*0.175, height*0.825);
}


class Body {
  constructor(x, y, diameter) {
    let numPoints = floor(diameter / 8);
    numPoints = max(3, numPoints);
    
    this.radius = diameter / 2.828;
    
    this.points = [];
    this.addPoints(x, y, numPoints);
    
    this.area = (this.radius * this.radius * PI) * 2;
    this.circumference = this.radius * TWO_PI;
            
    this.c = color(50, 60, 75);
    this.strokeColor = lerpColor(this.c, color(0), 0.5);
  }
  
  addPoints(x, y, numPoints) {
    let pos = createVector(x, y);

    for (let i = 0; i < numPoints; i++) {
      let theta = TWO_PI * i / numPoints;
      let offset = p5.Vector.fromAngle(theta);
      pos.add(offset);
      
      this.points.push(new Point(pos.x, pos.y));
    }
  }
  
  applyGravity() {
    this.points.forEach(point => {
      point.applyGravity();
    });
  }
  
  applyPhysics() {
    this.points.forEach(point => {
      point.applyPhysics();
    });
  }
  
  getArea() {
    let area = 0;
    
    this.points.forEach((point, i) => {
      let next = getNext(this.points, i);
      
      let base = point.pos.x - next.pos.x;
      let avgHeight = (point.pos.y + next.pos.y) / 2;
      
      let trapezoid = base * avgHeight;
      area += trapezoid;
    });
    
    return area;
  }
  
  dilatePoints(dist) {
    this.points.forEach((point, i) => {
      let prev = getPrev(this.points, i);
      let next = getNext(this.points, i);
      
      let dir = p5.Vector.sub(prev.pos, next.pos);
      dir.set(-dir.y, dir.x);
      dir.setMag(dist);
      point.accumDisplacement(dir);
    });
  }

  constrainPoints(dist) {
    this.points.forEach((point, i) => {
      let next = getNext(this.points, i);
      let dir = p5.Vector.sub(next.pos, point.pos);
      
      if (dir.mag() <= dist) {
        return;
      }
      
      let error = dir.mag() - dist;
          
      dir.setMag(error / 2.0);
      point.accumDisplacement(dir);
          
      dir.mult(-1);
      next.accumDisplacement(dir); 
    });
  }
  
  applyDisplacement() {
    this.points.forEach(point => {
      point.applyDisplacement();
    });
  }
  
  handleCollisions() {
    this.points.forEach(point => {
      point.handleCollisions();
    });
  }

  update() {
    this.applyGravity();
    this.applyPhysics();

    for (let i = 0; i < 10; i++) {
      let error = this.area - this.getArea();
      let offset = error / this.circumference;
      this.dilatePoints(offset);
      
      let numPoints = this.points.length;
      let dist = this.circumference / numPoints;
      this.constrainPoints(dist);
      
      this.applyDisplacement();

      this.handleCollisions();
    }
    
    this.handleWinning();
  }
  
  renderBody() {
    strokeWeight(8);
    stroke(this.strokeColor);
    fill(this.c);
    
    beginShape();
    
    this.points.forEach(point => {
      curveVertex(point.pos.x, point.pos.y);      
    });
    
    for (let i = 0; i < 3; i++) {
      let point = this.points[i];
      curveVertex(point.pos.x, point.pos.y)
    }
    
    endShape();   
  }
  
  renderPoints() {
    this.points.forEach(point => {
      point.render();
    }); 
  }

  render() {
    this.renderBody();
    
    if (mouseIsPressed) {
      this.renderPoints();
    }
  }
  
  handleWinning() {
    this.points.forEach(point => {
      if (point.pos.x < width*0.175 &&
          point.pos.y > height*0.65 &&
          point.pos.y < height*0.825 &&
          point.pos.y > point.pos.x + height*0.65) {
        won = true;
      }
    });
  }
}

class Point {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.ppos = this.pos.copy();
    
    this.vel = createVector(0, 0);
    this.pvel = createVector(0, 0);
    
    this.displacement = createVector(0, 0);
    this.numOffsets = 0;
    
    this.size = 8;
    this.c = color(110);
  }
  
  applyGravity() {
    this.pvel.sub(gravity);
  }
  
  applyPhysics() {
    let acc = p5.Vector.sub(this.vel, this.pvel);
    acc.mult(0.1);
    
    this.pvel = this.vel.copy();
    
    this.vel = p5.Vector.sub(this.pos, this.ppos);
    this.vel.mult(0.99);
    
    this.ppos = this.pos.copy();
    
    this.vel.add(acc);
    this.pos.add(this.vel);
  }

   accumDisplacement(offset) {
    this.displacement.add(offset);
    this.numOffsets++;
  }

   applyDisplacement() {
    if (this.numOffsets === 0) {
      return;
    }
    
    this.displacement.div(this.numOffsets);
    this.pos.add(this.displacement);
      
    this.displacement.set(0, 0);
    this.numOffsets = 0;
  }
  
  handleBallCollisions() {
    balls.forEach(ball => {
       let dir = p5.Vector.sub(this.pos, ball.pos);

       if (dir.mag() < ball.radius) {
         dir.setMag(ball.radius);
         this.pos = p5.Vector.add(ball.pos, dir);
       }
     });
  }
  
  multVel(num) {
    this.ppos.lerp(this.pos, 1 - num);
  }
  
  isInBox(box) {
    return (
      this.pos.x > box.x - box.w/2 &&
      this.pos.x < box.x + box.w/2 &&
      this.pos.y > box.y - box.h/2 &&
      this.pos.y < box.y + box.h/2
    );
  }
  
  handleBoxCollisions() {
    boxes.forEach(box => {
      if (!this.isInBox(box)) {       
        return;
      }
      
      box.corners.forEach((corner, i, corners) => {
        let nextCorner = getNext(corners, i);
        
        if (isIntersecting(this.ppos, this.pos,
                           corner, nextCorner)) {
          let newPos = getIntersection(this.ppos, this.pos,
                                       corner, nextCorner);
          this.pos.set(newPos);
        }
      });
    });
  }

  handleScreenCollisions() {
    if (this.pos.x < this.size/2) {
      this.pos.x = this.size/2;
      this.multVel(0.9);
    }
    else if (this.pos.x > width - this.size/2) {
      this.pos.x = width - this.size/2;
      this.multVel(0.9);
    }
    
    if (this.pos.y < this.size/2) {
      this.pos.y = this.size/2;
      this.multVel(0.9);
    }
    else if (this.pos.y > height - this.size/2) {
      this.pos.y = height - this.size/2;
      this.multVel(0.9);
    } 
  }
  
  handleCollisions() {
    if (this instanceof AnchorPoint) {
      return;
    }
    
    this.handleBallCollisions();
    this.handleBoxCollisions();
    this.handleScreenCollisions();
  }
  
  render() {
    strokeWeight(this.size);
    stroke(this.c);
    noFill();

    point(this.pos.x, this.pos.y);
  }
}

class AnchorPoint extends Point {
  constructor(x, y) {
    super(x, y);   
    this.anchorPos = createVector(x, y);
    this.size = 16;
  }
  
  render() {
    this.c = color(255, 100, 0);
    super.render();
  }
}

class Ball {
  constructor(x, y, diameter) {
    this.pos = createVector(x, y);
    this.radius = diameter / 2;
    this.c = color(100, 200, 175, 125);
  }
  
  render() {
    noStroke();
    fill(this.c);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }
}

class MouseBall extends Ball {
  constructor(diameter) {
    super(mouseX, mouseY, diameter);
    this.c = color(255, 125, 75, 125);
  }
  
  update() {
    this.pos.set(mouseX, mouseY);
    this.handleScreenCollisions();  
  }
  
  handleScreenCollisions() {
    if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
    }
    else if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
    }
    
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
    }
    else if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
    }
  }
}

class Box {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    
    this.topLeft = createVector(this.x - this.w/2,
                                this.y - this.h/2);
    this.topRight = createVector(this.x + this.w/2,
                                 this.y - this.h/2);
    this.bottomRight = createVector(this.x + this.w/2,
                                    this.y + this.h/2);
    this.bottomLeft = createVector(this.x - this.w/2,
                                   this.y + this.h/2);
      
    this.corners = [this.topLeft,
                   this.topRight,
                   this.bottomRight,
                   this.bottomLeft];
    
    this.c = color(255, 200, 100, 125);
  }
  
  render() {
    noStroke();
    fill(this.c);
    rect(this.x, this.y, this.w, this.h);
  }
}

class Row extends Box {
  constructor(left, right, y) {
    let x = (left + right) / 2;
    let w = right - left;
    let h = height * 0.025;
    super(x, y, w, h);
    
    balls.push(new Ball(left, y, width*0.075));
    balls.push(new Ball(right, y, width*0.075));
  }
}

class Column extends Box {
  constructor(top, bottom, x) {
    let y = (top + bottom) / 2;
    let w = width * 0.025;
    let h = bottom - top;
    super(x, y, w, h);
    
    balls.push(new Ball(x, top, height*0.075));
    balls.push(new Ball(x, bottom, height*0.075));
  }
}
