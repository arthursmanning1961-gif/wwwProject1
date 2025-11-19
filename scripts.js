// balls bounce off each other - atm 11/19/25 - 3:11
// update 11/19/25-3:04
// mass proportional to ball size added - atm 3?16
// circular bounds interaction rather than simple rectangle boundary
// --- Canvas Setup ---
const canvas = document.getElementById('bouncingCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 600;
canvas.height = 400;

// Array to hold all the ball objects
const balls = [];

// Mouse state object for tracking drag interactions
const mouse = {
    x: undefined,
    y: undefined,
    isDown: false,
    draggedBall: null, // The ball currently being controlled by the mouse
    lastX: 0, 
    lastY: 0
};

// --- Helper Functions ---

/**
 * Calculates the Euclidean distance between two points.
 */
function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

/**
 * Rotates a velocity vector (x, y) by a given angle. Used for collision physics.
 */
function rotate(x, y, angle) {
    const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
    return { x: rotatedX, y: rotatedY };
}

/**
 * Handles elastic collision between two balls, resolving overlap and calculating new velocities.
 */
function resolveCollision(ballA, ballB) {
    const xDist = ballB.x - ballA.x;
    const yDist = ballB.y - ballA.y;
    const dist = distance(ballA.x, ballA.y, ballB.x, ballB.y);

    // Collision detected if distance is less than or equal to sum of radii
    if (dist <= ballA.radius + ballB.radius) {
        
        // 1. Calculate Collision Axis (Angle)
        const angle = Math.atan2(yDist, xDist);
        const totalMass = ballA.mass + ballB.mass;

        // 2. Positional Correction (Prevent Overlap)
        const overlap = (ballA.radius + ballB.radius) - dist;
        
        // Separate proportionally to mass (lighter ball moves further)
        const sepA = overlap * (ballB.mass / totalMass);
        const sepB = overlap * (ballA.mass / totalMass);

        // Move the balls immediately apart along the collision axis
        ballA.x -= Math.cos(angle) * sepA;
        ballA.y -= Math.sin(angle) * sepA;
        ballB.x += Math.cos(angle) * sepB;
        ballB.y += Math.sin(angle) * sepB;

        // 3. Velocity Calculation (Conservation of Momentum)
        
        // Rotate velocities to align with the collision axis (u1, u2 are initial 1D velocities)
        const u1 = rotate(ballA.vx, ballA.vy, angle);
        const u2 = rotate(ballB.vx, ballB.vy, angle);

        // Apply the 1D elastic collision formula on the x-axis
        const v1 = {
            x: u1.x * (ballA.mass - ballB.mass) / totalMass + u2.x * 2 * ballB.mass / totalMass,
            y: u1.y // y-velocity (perpendicular to collision) remains unchanged
        };
        const v2 = {
            x: u2.x * (ballB.mass - ballA.mass) / totalMass + u1.x * 2 * ballA.mass / totalMass,
            y: u2.y
        };

        // Rotate the resulting velocities back to the original coordinate system
        const vf1 = rotate(v1.x, v1.y, -angle);
        const vf2 = rotate(v2.x, v2.y, -angle);

        // 4. Apply New Velocities
        ballA.vx = vf1.x;
        ballA.vy = vf1.y;
        ballB.vx = vf2.x;
        ballB.vy = vf2.y;
    }
}


// --- Ball Class ---

class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        
        // Mass proportional to volume (Radius Cubed) for mass-aware interaction
        this.mass = Math.PI * radius * radius * radius / 100; 
    }

    // Method to draw the ball on the canvas
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    /**
     * Updates ball position and handles wall collisions with positional correction.
     */
    update() {
        // Apply velocity to update position first (predictive)
        this.x += this.vx;
        this.y += this.vy;

        const damping = 0.98;

        // 1. Check Right Wall
        if (this.x + this.radius > canvas.width) {
            this.vx = -Math.abs(this.vx) * damping; // Force velocity left
            this.x = canvas.width - this.radius;     // Correct position
        }
        
        // 2. Check Left Wall
        if (this.x - this.radius < 0) {
            this.vx = Math.abs(this.vx) * damping;   // Force velocity right
            this.x = this.radius;                    // Correct position
        }
        
        // 3. Check Bottom Wall
        if (this.y + this.radius > canvas.height) {
            this.vy = -Math.abs(this.vy) * damping; // Force velocity up
            this.y = canvas.height - this.radius;    // Correct position
        }
        
        // 4. Check Top Wall
        if (this.y - this.radius < 0) {
            this.vy = Math.abs(this.vy) * damping;  // Force velocity down
            this.y = this.radius;                   // Correct position
        }
    }
}


// --- Initialization ---

/**
 * Creates and positions the balls, ensuring they do not overlap initially.
 */
function init() {
    for (let i = 0; i < 10; i++) {
        const radius = Math.random() * 10 + 8; // Radius between 8 and 18
        let x = Math.random() * (canvas.width - radius * 2) + radius;
        let y = Math.random() * (canvas.height - radius * 2) + radius;

        // Check for overlap with existing balls before placing
        for (let j = 0; j < balls.length; j++) {
            if (distance(x, y, balls[j].x, balls[j].y) < radius + balls[j].radius) {
                // If overlap, regenerate position and restart check
                x = Math.random() * (canvas.width - radius * 2) + radius;
                y = Math.random() * (canvas.height - radius * 2) + radius;
                j = -1; // Set to -1 because the loop increments it to 0
            }
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        balls.push(new Ball(x, y, radius, color));
    }
}

// --- Main Loop ---

function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Step 1: Handle Ball-to-Ball Collisions
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            resolveCollision(balls[i], balls[j]);
        }
    }

    // Step 2: Update and Draw Balls
    balls.forEach(ball => {
        
        if (ball === mouse.draggedBall) {
            // Dragged ball position is updated by its accumulated velocity
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Add slight friction/drag even during mouse control
            ball.vx *= 0.95;
            ball.vy *= 0.95;
            
            // Wall check is still necessary to keep the dragged ball inside the bounds
            ball.update();
        } else {
            // Normal physics update (wall bouncing)
            ball.update();
        }
        
        // Draw the ball
        ball.draw(); 
    });
}


// --- Event Listeners (Mass-Aware Dragging) ---

canvas.addEventListener('mousemove', (event) => {
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;

    if (mouse.draggedBall) {
        const ball = mouse.draggedBall;
        
        // Calculate the vector from the ball to the mouse (like a spring force)
        const dx = mouse.x - ball.x;
        const dy = mouse.y - ball.y;
        
        // Calculate Acceleration (a = F/m). Force is based on distance to mouse.
        // A larger mass results in a smaller acceleration for the same force.
        const targetAccelerationX = dx * 0.05;
        const targetAccelerationY = dy * 0.05;
        
        // Add acceleration to the ball's velocity
        ball.vx += targetAccelerationX / ball.mass;
        ball.vy += targetAccelerationY / ball.mass;
    }
    
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
});

canvas.addEventListener('mousedown', (event) => {
    mouse.isDown = true;
    mouse.lastX = event.offsetX;
    mouse.lastY = event.offsetY;

    // Check if the click is near any ball
    for (const ball of balls) {
        const distanceToMouse = distance(mouse.x, mouse.y, ball.x, ball.y);

        if (distanceToMouse < ball.radius + 15) { // 15px buffer for easier clicking
            mouse.draggedBall = ball; 
            break;
        }
    }
});

canvas.addEventListener('mouseup', () => {
    mouse.isDown = false;

    if (mouse.draggedBall) {
        // Stop dragging. The ball continues moving with the velocity (momentum)
        // it accumulated during the drag.
        mouse.draggedBall = null;
    }
});

// Start the application
init();
animate();