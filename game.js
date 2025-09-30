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
    
    // Power-up variables
    let hasShield = false;
    let shieldTimeLeft = 0;
    let shieldElement = null;
    let nightModeActive = false;
    
    // Character skin variables
    let availableSkins = ['default', 'golden', 'rainbow', 'ninja'];
    let currentSkin = localStorage.getItem('currentSkin') || 'default';
    let unlockedSkins = localStorage.getItem('unlockedSkins') ? 
                        JSON.parse(localStorage.getItem('unlockedSkins')) : 
                        ['default'];
                        
    // Apply current skin
    applySkin(currentSkin);
    
    // Handle loading screen click
    dinoLogo.addEventListener('click', () => {
        // Fade out loading screen
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Show game container after loading screen is dismissed
            gameContainer.style.display = 'block';
            document.querySelector('.container').style.display = 'flex';
            
            // Play background music at low volume if available
            const backgroundMusic = document.getElementById('background-music');
            if (backgroundMusic) {
                backgroundMusic.volume = 0.3;
                backgroundMusic.play().catch(e => console.log('Audio play prevented:', e));
            }
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
    
    // Generate particles with performance optimization
    function generateParticles() {
        if (isGameOver) return;
        // Limit particles based on device performance
        if (document.querySelectorAll('div[style*="ffd700"]').length < 15) {
            createParticle();
        }
        setTimeout(generateParticles, 500);
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
    
    // Konami code implementation
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    // Control with spacebar and touch
    function control(e) {
        if (e.keyCode === 32 || e.type === 'touchstart') {
            e.preventDefault(); // Prevent scrolling on mobile
            if (!isGameOver) jump();
            if (isGameOver) resetGame();
        }
        
        // Check for Konami code
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            
            if (konamiIndex === konamiCode.length) {
                // Konami code completed!
                konamiIndex = 0;
                activateKonamiCode();
            }
        } else {
            konamiIndex = 0;
        }
    }
    
    // Activate Konami code easter egg
    function activateKonamiCode() {
        // Rainbow effect on character
        trex.style.filter = 'hue-rotate(0deg)';
        let hue = 0;
        
        const rainbowEffect = setInterval(() => {
            hue = (hue + 2) % 360;
            trex.style.filter = `hue-rotate(${hue}deg)`;
            
            if (isGameOver) {
                clearInterval(rainbowEffect);
                trex.style.filter = 'none';
            }
        }, 50);
        
        // Invincibility for 10 seconds
        activateShield();
        shieldTimeLeft = 20; // Extended shield time
        
        // Special message
        const message = document.createElement('div');
        message.textContent = 'SUPER MODE ACTIVATED!';
        message.style.position = 'absolute';
        message.style.top = '30%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = 'gold';
        message.style.fontSize = '24px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        message.style.zIndex = '100';
        
        gameContainer.appendChild(message);
        
        setTimeout(() => {
            gameContainer.removeChild(message);
        }, 3000);
    }
    
    document.addEventListener('keydown', control);
    gameContainer.addEventListener('touchstart', control);
    document.addEventListener('touchstart', function(e) {
        if (e.target === dinoLogo) return; // Allow loading screen click
        e.preventDefault(); // Prevent default touch behavior
    }, { passive: false });
    
    // Generate power-ups
    function generatePowerUp() {
        if (isGameOver) return;
        
        // Only generate power-ups occasionally (1 in 5 chance)
        if (Math.random() > 0.2) {
            setTimeout(generatePowerUp, 10000); // Try again in 10 seconds
            return;
        }
        
        let powerUpPosition = gameContainer.offsetWidth;
        const powerUp = document.createElement('div');
        powerUp.classList.add('power-up');
        
        // Position power-up at random height
        const height = Math.floor(Math.random() * 3) * 40 + 60;
        powerUp.style.bottom = height + 'px';
        powerUp.style.left = powerUpPosition + 'px';
        
        gameContainer.appendChild(powerUp);
        
        // Move power-up
        const moveSpeed = 8 * difficultyLevel;
        let timerId = setInterval(() => {
            if (powerUpPosition < -20) {
                // Remove power-up when it's off screen
                clearInterval(timerId);
                gameContainer.removeChild(powerUp);
            } else if (
                powerUpPosition > 0 && 
                powerUpPosition < 60 && 
                Math.abs(position - parseInt(powerUp.style.bottom)) < 50
            ) {
                // Collision with player - activate shield
                clearInterval(timerId);
                gameContainer.removeChild(powerUp);
                activateShield();
            } else {
                // Move power-up
                powerUpPosition -= moveSpeed;
                powerUp.style.left = powerUpPosition + 'px';
            }
        }, gameSpeed);
        
        // Schedule next power-up
        if (!isGameOver) setTimeout(generatePowerUp, 15000);
    }
    
    // Activate shield power-up
    function activateShield() {
        hasShield = true;
        shieldTimeLeft = 10; // 10 seconds of shield
        
        // Create shield visual effect
        if (!shieldElement) {
            shieldElement = document.createElement('div');
            shieldElement.classList.add('shield');
            trex.appendChild(shieldElement);
        }
        
        // Show shield
        shieldElement.style.display = 'block';
        
        // Shield timer
        const shieldTimer = setInterval(() => {
            shieldTimeLeft--;
            
            // Flash shield when about to expire
            if (shieldTimeLeft < 3) {
                shieldElement.style.opacity = shieldElement.style.opacity === '1' ? '0.3' : '1';
            }
            
            if (shieldTimeLeft <= 0 || isGameOver) {
                clearInterval(shieldTimer);
                hasShield = false;
                shieldElement.style.display = 'none';
            }
        }, 1000);
    }

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
                position < (obstacleType === 'bird' ? parseInt(obstacle.style.bottom) + 20 : 60) &&
                !hasShield // Shield protects from obstacles
            ) {
                // Improved collision detection based on obstacle type
                clearInterval(timerId);
                gameOver();
            } else if (
                obstaclePosition > 0 && 
                obstaclePosition < 60 && 
                position < (obstacleType === 'bird' ? parseInt(obstacle.style.bottom) + 20 : 60) &&
                hasShield // Shield hit effect
            ) {
                // Shield blocks the obstacle
                clearInterval(timerId);
                gameContainer.removeChild(obstacle);
                
                // Visual feedback for shield hit
                shieldElement.style.opacity = '0.3';
                setTimeout(() => {
                    if (hasShield) shieldElement.style.opacity = '1';
                }, 300);
            } else {
                // Move obstacle with speed based on difficulty
                obstaclePosition -= moveSpeed;
                obstacle.style.left = obstaclePosition + 'px';
            }
        }, gameSpeed);
        
        if (!isGameOver) setTimeout(generateObstacles, randomTime);
    }
    
    // Game loop with optimized performance
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
                    
                    // Special milestone effect
                    createMilestoneEffect();
                }
                
                // Toggle day/night mode every 500 points
                if (score % 500 === 0 && score > 0) {
                    toggleDayNightMode();
                }
                
                // Process all game elements in batches for better performance
                processGameElements();
            }
        }, 100);
        
        // Return timer ID for cleanup
        return scoreTimerId;
    }
    
    // Process game elements in batches for better performance
    function processGameElements() {
        // Process all obstacles in a single batch
        const obstacles = document.querySelectorAll('.obstacle');
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            const obstacleLeft = parseInt(window.getComputedStyle(obstacle).getPropertyValue('left'));
            
            // Check for collision optimization
            if (obstacleLeft < 60 && obstacleLeft > 0) {
                // Only check detailed collision when obstacle is near player
                checkDetailedCollision(obstacle);
            }
        }
        
        // Process all power-ups in a single batch
        const powerUps = document.querySelectorAll('.power-up');
        for (let i = 0; i < powerUps.length; i++) {
            const powerUp = powerUps[i];
            const powerUpLeft = parseInt(window.getComputedStyle(powerUp).getPropertyValue('left'));
            
            // Check for power-up collection when near player
            if (powerUpLeft < 60 && powerUpLeft > 0) {
                checkPowerUpCollection(powerUp);
            }
        }
    }
    
    // Process game elements in batches for better performance
    function processGameElements() {
        // Process all obstacles in a single batch
        const obstacles = document.querySelectorAll('.obstacle');
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            const obstacleLeft = parseInt(window.getComputedStyle(obstacle).getPropertyValue('left'));
            
            // Check for collision optimization
            if (obstacleLeft < 60 && obstacleLeft > 0) {
                // Only check detailed collision when obstacle is near player
                checkDetailedCollision(obstacle);
            }
        }
        
        // Process all power-ups in a single batch
        const powerUps = document.querySelectorAll('.power-up');
        for (let i = 0; i < powerUps.length; i++) {
            const powerUp = powerUps[i];
            const powerUpLeft = parseInt(window.getComputedStyle(powerUp).getPropertyValue('left'));
            
            // Check for power-up collection when near player
            if (powerUpLeft < 60 && powerUpLeft > 0) {
                checkPowerUpCollection(powerUp);
            }
        }
    }
    
    // Create special effect for score milestones
    function createMilestoneEffect() {
        // Create milestone message
        const milestone = document.createElement('div');
        milestone.textContent = `${score} POINTS!`;
        milestone.classList.add('milestone');
        milestone.style.position = 'absolute';
        milestone.style.top = '40%';
        milestone.style.left = '50%';
        milestone.style.transform = 'translate(-50%, -50%)';
        milestone.style.color = '#FFD700';
        milestone.style.fontSize = '28px';
        milestone.style.fontWeight = 'bold';
        milestone.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7)';
        milestone.style.zIndex = '100';
        milestone.style.opacity = '1';
        milestone.style.transition = 'all 1s ease-out';
        
        gameContainer.appendChild(milestone);
        
        // Animate milestone
        setTimeout(() => {
            milestone.style.transform = 'translate(-50%, -100px)';
            milestone.style.opacity = '0';
        }, 100);
        
        setTimeout(() => {
            gameContainer.removeChild(milestone);
        }, 1500);
        
        // Create firework particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '5px';
            particle.style.height = '5px';
            particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            particle.style.borderRadius = '50%';
            particle.style.top = '50%';
            particle.style.left = '50%';
            particle.style.zIndex = '99';
            
            gameContainer.appendChild(particle);
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            let x = 0;
            let y = 0;
            let opacity = 1;
            
            const animateParticle = setInterval(() => {
                if (opacity <= 0) {
                    clearInterval(animateParticle);
                    gameContainer.removeChild(particle);
                } else {
                    x += dx;
                    y += dy;
                    opacity -= 0.02;
                    particle.style.transform = `translate(${x}px, ${y}px)`;
                    particle.style.opacity = opacity;
                }
            }, 20);
        }
    }
    
    // Apply character skin
    function applySkin(skinName) {
        // Remove all skin classes
        trex.classList.remove('skin-default', 'skin-golden', 'skin-rainbow', 'skin-ninja');
        
        // Add selected skin class
        trex.classList.add(`skin-${skinName}`);
        currentSkin = skinName;
        
        // Save current skin preference
        localStorage.setItem('currentSkin', currentSkin);
    }
    
    // Unlock new skin
    function unlockSkin(skinName) {
        if (!unlockedSkins.includes(skinName)) {
            unlockedSkins.push(skinName);
            localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
            
            // Show unlock message
            const unlockMessage = document.createElement('div');
            unlockMessage.textContent = `NEW SKIN UNLOCKED: ${skinName.toUpperCase()}!`;
            unlockMessage.style.position = 'absolute';
            unlockMessage.style.top = '35%';
            unlockMessage.style.left = '50%';
            unlockMessage.style.transform = 'translate(-50%, -50%)';
            unlockMessage.style.color = '#FFD700';
            unlockMessage.style.fontSize = '24px';
            unlockMessage.style.fontWeight = 'bold';
            unlockMessage.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7)';
            unlockMessage.style.zIndex = '100';
            
            gameContainer.appendChild(unlockMessage);
            
            setTimeout(() => {
                gameContainer.removeChild(unlockMessage);
            }, 3000);
            
            // Apply the new skin
            applySkin(skinName);
        }
    }
    
    // Cycle through unlocked skins
    function cycleSkins() {
        const currentIndex = unlockedSkins.indexOf(currentSkin);
        const nextIndex = (currentIndex + 1) % unlockedSkins.length;
        applySkin(unlockedSkins[nextIndex]);
    }
    
    // Add double-click to change skins
    trex.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (!isGameOver && unlockedSkins.length > 1) {
            cycleSkins();
        }
    });

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
        
        // Update score summary
        document.getElementById('final-score').textContent = score;
        document.getElementById('end-high-score').textContent = highScore;
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            document.getElementById('achievement-summary').innerHTML = '<div class="achievement">🏆 NEW HIGH SCORE! 🏆</div>';
        }
        
        // Display achievements
        let achievementHTML = '';
        if (score >= 100) achievementHTML += '<div class="achievement">🌟 Century Runner</div>';
        if (score >= 50) achievementHTML += '<div class="achievement">🚀 Half Century</div>';
        if (unlockedSkins.length > 1) achievementHTML += '<div class="achievement">👑 Skin Collector</div>';
        if (powerUpsCollected > 0) achievementHTML += '<div class="achievement">💪 Power Player</div>';
        
        if (achievementHTML) {
            document.getElementById('achievement-summary').innerHTML += achievementHTML;
        }
        
        // Setup restart button
        document.getElementById('restart-button').addEventListener('click', resetGame);
        
        // Remove all obstacles
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            obstacle.remove();
        });
        
        // Unlock skins based on high score
        if (highScore >= 500 && !unlockedSkins.includes('golden')) {
            unlockSkin('golden');
        }
        if (highScore >= 1000 && !unlockedSkins.includes('rainbow')) {
            unlockSkin('rainbow');
        }
        if (highScore >= 2000 && !unlockedSkins.includes('ninja')) {
            unlockSkin('ninja');
        }
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
        
        // Clear achievement summary
        document.getElementById('achievement-summary').innerHTML = '';
        
        // Add smooth transition effect
        gameContainer.classList.add('game-restart');
        setTimeout(() => {
            gameContainer.classList.remove('game-restart');
        }, 500);
        
        startGame();
    }
    
    // Toggle day/night mode
    function toggleDayNightMode() {
        nightModeActive = !nightModeActive;
        
        if (nightModeActive) {
            // Night mode
            gameContainer.classList.add('night-mode');
            document.body.style.backgroundColor = '#0a0a2a';
            
            // Add stars
            for (let i = 0; i < 20; i++) {
                const star = document.createElement('div');
                star.classList.add('star');
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 60}%`;
                star.style.animationDelay = `${Math.random() * 3}s`;
                gameContainer.appendChild(star);
            }
        } else {
            // Day mode
            gameContainer.classList.remove('night-mode');
            document.body.style.backgroundColor = '#f7f7f7';
            
            // Remove stars
            document.querySelectorAll('.star').forEach(star => star.remove());
        }
    }
    
    // Start game
    function startGame() {
        isGameOver = false;
        score = 0;
        position = 0;
        difficultyLevel = 1;
        scoreDisplay.textContent = '0';
        gameOverDisplay.classList.add('hidden');
        trex.style.bottom = '0px';
        
        // Clear any existing obstacles
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            obstacle.remove();
        });
        
        // Start generating obstacles
        generateObstacles();
        
        // Start generating power-ups
        generatePowerUp();
        
        // Start updating score
        updateScore();
        
        // Start generating particles
        generateParticles();
        
        // Reset to day mode
        if (nightModeActive) {
            toggleDayNightMode();
        }
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