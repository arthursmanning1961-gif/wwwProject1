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
    lastX: 0, // Store last mouse position for velocity calculation
    lastY: 0
};

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
        this.vx = (Math.random() - 0.5) * 2; // -1 to 1
        this.vy = (Math.random() - 0.5) * 2; // -1 to 1
        this.mass = radius / 5; // Mass for simple drag logic
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
            this.vx = -this.vx;
        }
        // Bounce off top/bottom walls
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.vy = -this.vy;
        }

        // Apply velocity to update position
        this.x += this.vx;
        this.y += this.vy;
        
        // **Removed this.draw() - drawing is handled in the animate loop**
    }
}

/**
 * Initialization: Create a set of balls
 */
function init() {
    // Generate 10 random balls
    for (let i = 0; i < 10; i++) {
        // Ensure balls start fully within the canvas
        const radius = Math.random() * 10 + 8; // Radius between 8 and 18
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;

        // Get a random color
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        balls.push(new Ball(x, y, radius, color));
    }
}

/**
 * Animation Loop
 */
function animate() {
    requestAnimationFrame(animate);

    // Clear the entire canvas on each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw all balls
    balls.forEach(ball => {
        // If a ball is being dragged, override its position
        if (ball === mouse.draggedBall) {
            // Set position directly to mouse coordinates
            ball.x = mouse.x;
            ball.y = mouse.y;
            // The velocity calculation for the "flick" is now handled on mouseup
        } else {
            // For non-dragged balls, run the normal update logic (bouncing)
            ball.update();
        }
        
        // **FIX 1: Call draw() for ALL balls to keep the dragged ball visible.**
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

    // Store mouse coordinates to calculate velocity on the next frame (or on release)
    if (mouse.draggedBall) {
        // Calculate velocity (difference in position)
        mouse.draggedBall.vx = (mouse.x - mouse.lastX) * 0.8; // Dampen the flick velocity slightly
        mouse.draggedBall.vy = (mouse.y - mouse.lastY) * 0.8;
    }
    
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
});

canvas.addEventListener('mousedown', (event) => {
    mouse.isDown = true;
    mouse.lastX = event.offsetX;
    mouse.lastY = event.offsetY;

    // Check if the click is near any ball (within its radius + a buffer)
    for (const ball of balls) {
        const distance = Math.hypot(mouse.x - ball.x, mouse.y - ball.y);

        // If the click is close enough to the ball (e.g., within 15 pixels of the edge)
        if (distance < ball.radius + 15) {
            mouse.draggedBall = ball; // Select this ball for dragging
            break;
        }
    }
});

canvas.addEventListener('mouseup', () => {
    mouse.isDown = false;

    // When the mouse is released, the ball is no longer dragged
    if (mouse.draggedBall) {
        // **FIX 2: The velocity was already calculated in mousemove. We just need to stop dragging.**
        // The ball's last calculated vx and vy now serve as the initial velocity for the bouncing physics.
        
        mouse.draggedBall = null;
    }
});

// Start the application
init();
animate();