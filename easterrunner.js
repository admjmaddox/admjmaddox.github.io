// p5.js Easter Endless Runner
// Controls: Spacebar or Tap/Click to Jump

let rabbit;
let eggs = [];
let score = 0;
let gameSpeed = 5; // Initial speed
let speedIncrease = 0.005; // How much speed increases over time
let gravity;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let groundY;
let skyColor;
let groundColor;
let cloudColor;
let clouds = [];

// --- Pixel Art Functions ---

function drawPixelRabbit(x, y, size) {
  push();
  translate(x - size / 2, y - size); // Adjust position based on bottom-center
  noStroke();
  rectMode(CORNER);
  let pixel = size / 8; // Size of one 'pixel'

  // Body (White)
  fill(255);
  rect(pixel * 2, pixel * 3, pixel * 4, pixel * 4); // Main body
  rect(pixel * 3, pixel * 2, pixel * 2, pixel);     // Neck area

  // Head (White)
  rect(pixel * 3, pixel * 0, pixel * 2, pixel * 2); // Head block

  // Ears (Pink inside White)
  fill(255); // White base
  rect(pixel * 2, -pixel * 2, pixel, pixel * 3);
  rect(pixel * 5, -pixel * 2, pixel, pixel * 3);
  fill(255, 182, 193); // Pink inner
  rect(pixel * 2, -pixel * 1, pixel, pixel * 1);
  rect(pixel * 5, -pixel * 1, pixel, pixel * 1);

  // Eye (Black)
  fill(0);
  rect(pixel * 4, pixel * 0.5, pixel * 0.5, pixel * 0.5);

  // Feet (White)
  fill(255);
  rect(pixel * 2, pixel * 7, pixel * 1.5, pixel);
  rect(pixel * 4.5, pixel * 7, pixel * 1.5, pixel);

  // Tail (White Puff) - Optional small square
  // rect(pixel * 1, pixel * 5, pixel, pixel);

  pop();
}

function drawPixelEgg(x, y, size, baseColor, patternColor) {
  push();
  translate(x - size / 2, y - size); // Adjust position based on bottom-center
  noStroke();
  rectMode(CORNER);
  let pixel = size / 6; // Size of one 'pixel' for the egg

  // Main Egg Shape (Base Color)
  fill(baseColor);
  rect(pixel * 1, pixel * 1, pixel * 4, pixel * 5); // Main body
  rect(pixel * 2, pixel * 0, pixel * 2, pixel);     // Top curve part 1
  rect(pixel * 0, pixel * 3, pixel, pixel * 2);     // Left side curve
  rect(pixel * 5, pixel * 3, pixel, pixel * 2);     // Right side curve
  rect(pixel * 2, pixel * 6, pixel * 2, pixel);     // Bottom curve part 1


  // Pattern (Pattern Color) - Example: Stripes
  fill(patternColor);
  rect(pixel * 1, pixel * 2, pixel * 4, pixel);
  rect(pixel * 1, pixel * 4, pixel * 4, pixel);

  pop();
}

// --- Cloud Class ---
class Cloud {
    constructor(yPos, size) {
        this.x = width + random(size, width); // Start offscreen right
        this.y = yPos;
        this.size = size;
        this.speed = random(0.5, 1.5); // Clouds move slower
        this.pixel = this.size / 5; // Pixel size for cloud
    }

    update() {
        this.x -= this.speed * (gameSpeed / 5); // Move left relative to game speed
        if (this.x + this.size < 0) {
            this.x = width + random(this.size, width / 2); // Reset offscreen right
            this.y = random(height * 0.1, height * 0.4); // Randomize Y a bit on reset
        }
    }

    show() {
        push();
        translate(this.x, this.y);
        noStroke();
        fill(cloudColor);
        rectMode(CORNER);
        // Simple blocky cloud shape
        rect(0, this.pixel, this.size, this.pixel * 2);
        rect(this.pixel, 0, this.pixel * 3, this.pixel);
        rect(this.pixel, this.pixel * 3, this.pixel * 3, this.pixel);
        pop();
    }
}


// --- Rabbit Class ---
class Rabbit {
  constructor() {
    this.size = 50; // Base size, adjust as needed
    this.x = width / 4;
    this.y = groundY - this.size / 2; // Start on the ground
    this.velocityY = 0;
    this.lift = -10; // Jump force (negative is up)
  }

  jump() {
    // Only jump if on the ground
    if (this.y >= groundY - this.size / 2 - 1) { // Check if close to ground
        this.velocityY = this.lift;
    }
  }

  applyGravity() {
    this.y += this.velocityY;
    this.velocityY += gravity;

    // Prevent falling through the ground
    if (this.y >= groundY - this.size / 2) {
      this.y = groundY - this.size / 2;
      this.velocityY = 0;
    }
     // Prevent jumping too high (optional ceiling)
     if (this.y < this.size/2) {
        this.y = this.size/2;
        this.velocityY = 0;
     }
  }

  show() {
    drawPixelRabbit(this.x, this.y + this.size / 2, this.size); // Draw the rabbit
  }

  // Collision detection (simple bounding box)
  getBounds() {
      return {
          left: this.x - this.size / 4, // Approximate visual bounds
          right: this.x + this.size / 4,
          top: this.y - this.size / 2,
          bottom: this.y + this.size / 2
      };
  }
}

// --- Egg Class ---
class Egg {
  constructor() {
    this.size = random(30, 45); // Random egg size
    this.x = width; // Start offscreen right
    this.y = groundY - this.size / 2; // On the ground
    this.baseColor = color(random(150, 255), random(150, 255), random(200, 255)); // Pastel Base
    this.patternColor = color(random(100, 200), random(100, 200), random(150, 255)); // Contrasting Pastel Pattern
  }

  move() {
    this.x -= gameSpeed;
  }

  show() {
    drawPixelEgg(this.x, this.y + this.size / 2, this.size, this.baseColor, this.patternColor);
  }

  // Check if offscreen
  offscreen() {
    return this.x < -this.size;
  }

   // Collision detection (simple bounding box)
   getBounds() {
    return {
        left: this.x - this.size / 2.5, // Approximate visual bounds
        right: this.x + this.size / 2.5,
        top: this.y - this.size / 2,
        bottom: this.y + this.size / 2
    };
  }

  hits(rabbit) {
    let rabbitBounds = rabbit.getBounds();
    let eggBounds = this.getBounds();

    // Check for overlap
    return (
        rabbitBounds.right > eggBounds.left &&
        rabbitBounds.left < eggBounds.right &&
        rabbitBounds.bottom > eggBounds.top &&
        rabbitBounds.top < eggBounds.bottom
    );
  }
}

// --- p5.js Setup Function ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth(); // Crucial for pixelated look

  // Define colors
  skyColor = color(135, 206, 250); // Light Sky Blue
  groundColor = color(144, 238, 144); // Light Green
  cloudColor = color(255, 250, 250); // Snow White clouds

  // Calculate ground position
  groundY = height * 0.85; // Ground is lower 85% of the screen

  // Initialize physics and game objects
  gravity = 0.5; // Adjust gravity force as needed
  rabbit = new Rabbit();

   // Create initial clouds
   for (let i = 0; i < 5; i++) {
        clouds.push(new Cloud(random(height * 0.1, height * 0.4), random(60, 120)));
    }

  textAlign(CENTER, CENTER);
  textSize(24);
  textFont('monospace'); // Font that often looks blocky
}

// --- p5.js Draw Loop ---
function draw() {
  // --- Background ---
  background(skyColor); // Sky

  // Draw clouds
  for (let cloud of clouds) {
        if (gameState === 'playing') {
             cloud.update();
        }
        cloud.show();
   }

  // Draw Ground
  fill(groundColor);
  noStroke();
  rect(0, groundY, width, height - groundY);

  // --- Game State Logic ---
  if (gameState === 'start') {
    displayStartScreen();
  } else if (gameState === 'playing') {
    runGame();
  } else if (gameState === 'gameOver') {
    displayGameOverScreen();
  }
}

// --- Game Running Function ---
function runGame() {
   // --- Rabbit Logic ---
  rabbit.applyGravity();
  rabbit.show();

  // --- Egg Logic ---
  // Spawn eggs randomly based on frame count and speed
  let spawnRate = map(gameSpeed, 5, 20, 90, 40); // Faster speed = more frequent spawns (adjust numbers)
  spawnRate = constrain(spawnRate, 40, 90); // Keep spawn rate reasonable

  if (frameCount % floor(spawnRate) == 0) {
    // Add a chance to *not* spawn, preventing constant streams
    if (random(1) < 0.7) {
         eggs.push(new Egg());
    }
  }

  // Update and draw eggs, check for collisions
  for (let i = eggs.length - 1; i >= 0; i--) {
    eggs[i].move();
    eggs[i].show();

    // Check for collision
    if (eggs[i].hits(rabbit)) {
      gameState = 'gameOver';
      // Optional: Add a small visual cue like screen flash or sound here
    }

    // Remove eggs that are offscreen
    if (eggs[i].offscreen()) {
      eggs.splice(i, 1);
      score++; // Increase score when an egg goes offscreen
    }
  }

  // --- Score and Speed ---
  score += 0.05; // Increment score slowly over time as well
  gameSpeed += speedIncrease; // Gradually increase speed

  // Display Score
  displayScore();
  displayInstructions(); // Show controls during play
}

// --- Display Functions ---

function displayScore() {
  fill(0); // Black text
  textSize(30);
  text(`Score: ${floor(score)}`, width / 2, 50);
}

function displayInstructions() {
    fill(0, 0, 0, 150); // Semi-transparent black
    textSize(18);
    text("Space / Tap / Click = Jump", width / 2, height - 30);
}


function displayStartScreen() {
    fill(0);
    textSize(48);
    text("Easter Runner", width / 2, height / 2 - 50);
    textSize(24);
    text("Press Space / Tap / Click to Start", width / 2, height / 2 + 20);
    rabbit.show(); // Show rabbit standing still
}

function displayGameOverScreen() {
  // Keep drawing elements but stop updates
   rabbit.show(); // Show rabbit where it collided
   for (let egg of eggs) {
       egg.show(); // Show eggs where they were
   }

   // Game Over Text
  fill(255, 0, 0, 200); // Red semi-transparent overlay
  rect(0,0, width, height); // Cover screen slightly

  fill(255); // White text
  textSize(64);
  text("GAME OVER", width / 2, height / 2 - 40);
  textSize(32);
  text(`Final Score: ${floor(score)}`, width / 2, height / 2 + 30);
  textSize(24);
  text("Space / Tap / Click to Restart", width / 2, height / 2 + 80);
}

// --- Input Handling ---

function keyPressed() {
  handleInput();
  return false; // Prevent default browser behavior (like scrolling)
}

function mousePressed() {
  handleInput();
  return false; // Prevent default browser behavior
}

function touchStarted() {
  handleInput();
  return false; // Prevent default browser behavior (important for mobile)
}


function handleInput() {
    if (gameState === 'playing') {
        rabbit.jump();
    } else if (gameState === 'gameOver' || gameState === 'start') {
        resetGame();
    }
}

// --- Game Reset ---
function resetGame() {
    eggs = [];
    score = 0;
    gameSpeed = 5; // Reset initial speed
    rabbit = new Rabbit(); // Recreate the rabbit at start position
    gameState = 'playing';
    frameCount = 0; // Reset frameCount for consistent spawning at start
     // Reset clouds slightly
     clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push(new Cloud(random(height * 0.1, height * 0.4), random(60, 120)));
    }
}


// --- Responsive Canvas ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Recalculate positions based on new size
    groundY = height * 0.85;
    // If the game is not playing, might need to reposition rabbit etc.
    if (gameState !== 'playing') {
       rabbit.x = width / 4;
       rabbit.y = groundY - rabbit.size / 2;
    }
     // Could potentially reset/reposition clouds too if desired
}