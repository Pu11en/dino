document.addEventListener('DOMContentLoaded', () => {
    const trex = document.getElementById('trex');
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score');
    const gameOverDisplay = document.getElementById('game-over');
    const startButton = document.getElementById('start-button');
    const loadingScreen = document.getElementById('loading-screen');
    const dinoLogo = document.getElementById('dino-logo');
    
    // Sound elements
    const jumpSound = document.getElementById('jump-sound');
    const scoreSound = document.getElementById('score-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    
    let isJumping = false;
    let isGameOver = false;
    let score = 0;
    let gameSpeed = 20;
    let gravity = 0.9;
    let position = 0;
    let gameTimerId;
    let difficultyLevel = 1;
    let obstacleTypes = ['cactus', 'rock', 'bird'];
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let highScore = localStorage.getItem('highScore') || 0;
    
    // Handle loading screen click
    dinoLogo.addEventListener('click', () => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    });
    
    // Add transition for loading screen
    loadingScreen.style.transition = 'opacity 0.5s ease';
    
    // Add gold particle effect
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = '#ffd700';
        particle.style.borderRadius = '50%';
        particle.style.opacity = '0.7';
        particle.style.bottom = `${Math.random() * 200}px`;
        particle.style.left = `${Math.random() * gameContainer.offsetWidth}px`;
        particle.style.boxShadow = '0 0 3px #ffd700';
        
        gameContainer.appendChild(particle);
        
        // Animate particle
        let posY = parseInt(particle.style.bottom);
        let posX = parseInt(particle.style.left);
        let opacity = 0.7;
        
        const particleInterval = setInterval(() => {
            if (opacity <= 0 || posY >= 200) {
                clearInterval(particleInterval);
                gameContainer.removeChild(particle);
            } else {
                posY += 1;
                opacity -= 0.01;
                particle.style.bottom = `${posY}px`;
                particle.style.opacity = opacity;
            }
        }, 50);
    }
    
    // Generate particles
    function generateParticles() {
        if (isGameOver) return;
        createParticle();
        setTimeout(generateParticles, 300);
    }
    
    // Jump function with improved physics
    function jump() {
        if (isJumping) return;
        isJumping = true;
        
        // Play jump sound
        jumpSound.currentTime = 0;
        jumpSound.play().catch(e => console.log("Audio play error:", e));
        
        let jumpHeight = 150;
        let jumpSpeed = 8;
        let fallSpeed = 5;
        
        // Add jump animation class
        trex.classList.add('jumping');
        
        let upTimerId = setInterval(() => {
            // Jump up
            if (position >= jumpHeight) {
                clearInterval(upTimerId);
                
                // Fall down with gravity
                let downTimerId = setInterval(() => {
                    if (position <= 0) {
                        clearInterval(downTimerId);
                        isJumping = false;
                        position = 0;
                        trex.classList.remove('jumping');
                    } else {
                        // Accelerate fall with gravity
                        fallSpeed = Math.min(fallSpeed + 0.2, 10);
                        position -= fallSpeed;
                        if (position < 0) position = 0;
                        trex.style.bottom = position + 'px';
                    }
                }, 20);
            } else {
                // Decelerate as we reach peak of jump
                jumpSpeed = Math.max(jumpSpeed - 0.3, 4);
                position += jumpSpeed;
                trex.style.bottom = position + 'px';
            }
        }, 20);
    }
    
    // Control with spacebar and touch
    function control(e) {
        if (e.keyCode === 32 || e.type === 'touchstart') {
            if (!isGameOver) jump();
            if (isGameOver) resetGame();
        }
    }
    
    document.addEventListener('keydown', control);
    document.addEventListener('touchstart', control);
    
    // Generate obstacles with variety
    function generateObstacles() {
        // Adjust timing based on difficulty
        let randomTime = Math.random() * (4000 / difficultyLevel) + (1000 / difficultyLevel);
        let obstaclePosition = gameContainer.offsetWidth;
        
        // Select random obstacle type
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle', obstacleType);
        
        // Randomize obstacle height for birds
        if (obstacleType === 'bird') {
            const height = Math.floor(Math.random() * 3) * 40 + 40; // 40, 80, or 120px
            obstacle.style.bottom = height + 'px';
        }
        
        gameContainer.appendChild(obstacle);
        obstacle.style.left = obstaclePosition + 'px';
        
        // Speed based on difficulty
        const moveSpeed = 10 * difficultyLevel;
        
        let timerId = setInterval(() => {
            if (obstaclePosition < -20) {
                // Remove obstacle when it's off screen
                clearInterval(timerId);
                gameContainer.removeChild(obstacle);
            } else if (
                obstaclePosition > 0 && 
                obstaclePosition < 60 && 
                position < (obstacleType === 'bird' ? parseInt(obstacle.style.bottom) + 20 : 60)
            ) {
                // Improved collision detection based on obstacle type
                clearInterval(timerId);
                gameOver();
            } else {
                // Move obstacle with speed based on difficulty
                obstaclePosition -= moveSpeed;
                obstacle.style.left = obstaclePosition + 'px';
            }
        }, gameSpeed);
        
        if (!isGameOver) setTimeout(generateObstacles, randomTime);
    }
    
    // Update score
    function updateScore() {
        let scoreTimerId = setInterval(() => {
            if (isGameOver) {
                clearInterval(scoreTimerId);
            } else {
                score++;
                scoreDisplay.textContent = score;
                
                // Play score sound every 100 points
                if (score % 100 === 0) {
                    scoreSound.currentTime = 0;
                    scoreSound.play().catch(e => console.log("Audio play error:", e));
                    
                    // Increase difficulty level
                    if (difficultyLevel < 3) {
                        difficultyLevel += 0.5;
                    }
                    
                    // Increase game speed
                    if (gameSpeed > 10) {
                        gameSpeed--;
                    }
                }
            }
        }, 100);
    }
    
    // Game over
    function gameOver() {
        isGameOver = true;
        gameOverDisplay.classList.remove('hidden');
        clearInterval(gameTimerId);
        
        // Play game over sound
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.log("Audio play error:", e));
        
        // Add flash effect
        gameContainer.style.boxShadow = '0 0 20px #ff0000';
        setTimeout(() => {
            gameContainer.style.boxShadow = '0 0 10px #ffd700';
        }, 300);
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            gameOverDisplay.textContent = `GAME OVER - NEW HIGH SCORE: ${highScore}!`;
        } else {
            gameOverDisplay.textContent = `GAME OVER - SCORE: ${score} - HIGH SCORE: ${highScore}`;
        }
        
        // Remove all obstacles
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            obstacle.remove();
        });
    }
    
    // Reset game
    function resetGame() {
        isGameOver = false;
        isJumping = false;
        score = 0;
        position = 0;
        gameSpeed = 20;
        
        gameOverDisplay.classList.add('hidden');
        scoreDisplay.textContent = '0';
        trex.style.bottom = '0px';
        
        startGame();
    }
    
    // Start game
    function startGame() {
        updateScore();
        generateParticles();
        setTimeout(generateObstacles, 1000);
    }
    
    // Start button event listener
    startButton.addEventListener('click', () => {
        if (isGameOver) {
            resetGame();
        } else {
            startGame();
        }
    });
});