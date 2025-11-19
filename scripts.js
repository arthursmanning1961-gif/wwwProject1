// balls bounce off each other - atm 11/19/25 - 3:11
// update 11/19/25-3:04
// mass proportional to ball size added - atm 3?16
// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('bouncingCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 600;
canvas.height = 400;

// Array to hold all the ball objects
const balls = [];

// Mouse state object
const mouse = {
    x: undefined,
    y: undefined,
    isDown: false,
    draggedBall: null, // Stores the ball currently being dragged
    lastX: 0, // Store last mouse position
    lastY: 0
};

// --- Collision Logic (No changes needed here for mass-proportional dragging) ---

/**
 * Ball class definition
 */
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        // Initial velocity (how fast and in what direction the ball moves)
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        
        // Mass is proportional to volume (radius cubed) for a stronger effect
        this.mass = Math.PI * radius * radius * radius / 100; // Scaling down the mass value
    }

    // Method to draw the ball on the canvas
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    // Method to update the ball's position and handle boundaries
    update() {
        // --- Boundary/Wall Collision ---
        // Bounce off left/right walls
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.vx = -this.vx * 0.98;
            if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
            if (this.x - this.radius < 0) this.x = this.radius;
        }
        // Bounce off top/bottom walls
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.vy = -this.vy * 0.98;
            if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;
            if (this.y - this.radius < 0) this.y = this.radius;
        }

        // Apply velocity to update position
        this.x += this.vx;
        this.y += this.vy;
    }
}

/**
 * Helper function for distance calculation
 */
function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

// ... (Collision Resolution functions: resolveCollision, rotate remain the same) ...

/**
 * Collision Resolution (Elastic Collision)
 * This function handles both preventing overlap and calculating new velocities.
 * ... (function body remains the same as previous response) ...
 */
function resolveCollision(ballA, ballB) {
    const xDist = ballB.x - ballA.x;
    const yDist = ballB.y - ballA.y;
    const dist = distance(ballA.x, ballA.y, ballB.x, ballB.y);

    if (dist <= ballA.radius + ballB.radius) {
        const angle = Math.atan2(yDist, xDist);
        const overlap = (ballA.radius + ballB.radius) - dist;
        const totalMass = ballA.mass + ballB.mass;
        const sepA = overlap * (ballB.mass / totalMass);
        const sepB = overlap * (ballA.mass / totalMass);

        ballA.x -= Math.cos(angle) * sepA;
        ballA.y -= Math.sin(angle) * sepA;
        ballB.x += Math.cos(angle) * sepB;
        ballB.y += Math.sin(angle) * sepB;

        const u1 = rotate(ballA.vx, ballA.vy, angle);
        const u2 = rotate(ballB.vx, ballB.vy, angle);

        const v1 = {
            x: u1.x * (ballA.mass - ballB.mass) / totalMass + u2.x * 2 * ballB.mass / totalMass,
            y: u1.y
        };
        const v2 = {
            x: u2.x * (ballB.mass - ballA.mass) / totalMass + u1.x * 2 * ballA.mass / totalMass,
            y: u2.y
        };

        const vf1 = rotate(v1.x, v1.y, -angle);
        const vf2 = rotate(v2.x, v2.y, -angle);

        ballA.vx = vf1.x;
        ballA.vy = vf1.y;
        ballB.vx = vf2.x;
        ballB.vy = vf2.y;
    }
}

/**
 * Rotates a point (or velocity vector) by a given angle.
 */
function rotate(x, y, angle) {
    const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
    return { x: rotatedX, y: rotatedY };
}


/**
 * Initialization: Create a set of balls
 * ... (function body remains the same as previous response) ...
 */
function init() {
    for (let i = 0; i < 10; i++) {
        const radius = Math.random() * 10 + 8;
        let x = Math.random() * (canvas.width - radius * 2) + radius;
        let y = Math.random() * (canvas.height - radius * 2) + radius;

        // Check for overlap with existing balls before placing
        for (let j = 0; j < balls.length; j++) {
            if (distance(x, y, balls[j].x, balls[j].y) < radius + balls[j].radius) {
                x = Math.random() * (canvas.width - radius * 2) + radius;
                y = Math.random() * (canvas.height - radius * 2) + radius;
                j = -1;
            }
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        balls.push(new Ball(x, y, radius, color));
    }
}

/**
 * Animation Loop
 */
function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Collision Detection Loop
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            resolveCollision(balls[i], balls[j]);
        }
    }

    // Update and Draw Loop
    balls.forEach(ball => {
        // Drag logic overrides physics
        if (ball === mouse.draggedBall) {
            // **New:** Integrate velocity (calculated in mousemove) to update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Add slight friction/drag even during mouse control
            ball.vx *= 0.95;
            ball.vy *= 0.95;
        } else {
            // Normal physics update (wall bouncing)
            ball.update();
        }
        
        // Draw the ball
        ball.draw(); 
    });
}

/**
 * Event Listeners for Mouse Control
 */
canvas.addEventListener('mousemove', (event) => {
    // Update mouse position based on canvas coordinates
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;

    if (mouse.draggedBall) {
        const ball = mouse.draggedBall;
        
        // Calculate the vector of the mouse movement (Force direction)
        const dx = mouse.x - ball.x;
        const dy = mouse.y - ball.y;
        
        // **MASS-PROPORTIONAL INTERACTION:**
        // 1. Calculate the desired acceleration vector (based on distance to mouse).
        // The mouse position acts as a target, creating a "spring" force.
        const targetAccelerationX = dx * 0.05;
        const targetAccelerationY = dy * 0.05;
        
        // 2. Apply the acceleration (Force / Mass). 
        // Lighter balls (small mass) will have larger acceleration (a = F/m).
        ball.vx += targetAccelerationX / ball.mass;
        ball.vy += targetAccelerationY / ball.mass;
    }
    
    // Store last mouse position for the next frame
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

        if (distanceToMouse < ball.radius + 15) {
            mouse.draggedBall = ball; // Select this ball for dragging
            break;
        }
    }
});

canvas.addEventListener('mouseup', () => {
    mouse.isDown = false;

    if (mouse.draggedBall) {
        // Stop dragging. The ball now continues with the momentum (vx/vy) it accumulated
        // during the drag, ensuring a "flick" effect that respects its mass.
        mouse.draggedBall = null;
    }
});

// Start the application
init();
animate();