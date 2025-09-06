class ShakyProgressBar {
    constructor(width = 10, shakeIntensity = 2) {
        this.width = width;
        this.shakeIntensity = shakeIntensity;
        this.progress = 0; // 0-100
        this.isShaking = false;
        this.shakeOffset = 0;
        this.shakeDirection = 1; // 1 for right, -1 for left
        this.shakeSpeed = 50; // milliseconds between shake updates (original speed)
        this.shakeInterval = null;

        // Characters for the progress bar
        this.filledChar = '█';
        this.emptyChar = '░';

        // ANSI escape codes for terminal control
        this.clearScreen = '\x1b[2J\x1b[H';  // Clear screen and move cursor to top-left
        this.hideCursor = '\x1b[?25l';        // Hide cursor
        this.showCursor = '\x1b[?25h';        // Show cursor
    }

    // Set the progress (0-100)
    setProgress(progress) {
        this.progress = Math.max(0, Math.min(100, progress));
        this.render();
    }

    // Start the shaking animation
    startShaking() {
        if (this.isShaking) return;

        this.isShaking = true;
        this.shakeInterval = setInterval(() => {
            this.updateShake();
            this.render();
        }, this.shakeSpeed);
    }

    // Stop the shaking animation
    stopShaking() {
        this.isShaking = false;
        if (this.shakeInterval) {
            clearInterval(this.shakeInterval);
            this.shakeInterval = null;
        }
        this.shakeOffset = 0;
        this.render();
    }

    // Update the shake offset
    updateShake() {
        this.shakeOffset += this.shakeDirection * 0.5;

        // Reverse direction when reaching the shake intensity limit
        if (Math.abs(this.shakeOffset) >= this.shakeIntensity) {
            this.shakeDirection *= -1;
        }
    }

    // Generate the progress bar string
    generateBar() {
        const filledBlocks = Math.round((this.progress / 100) * this.width);
        const emptyBlocks = this.width - filledBlocks;

        const filled = this.filledChar.repeat(filledBlocks);
        const empty = this.emptyChar.repeat(emptyBlocks);

        return `[${filled}${empty}]`;
    }

    // Render the progress bar with shake effect to terminal
    render() {
        const bar = this.generateBar();
        const shakeSpaces = ' '.repeat(Math.abs(Math.round(this.shakeOffset)));

        let displayBar;
        if (this.shakeOffset > 0) {
            // Shake to the right
            displayBar = shakeSpaces + bar;
        } else if (this.shakeOffset < 0) {
            // Shake to the left
            displayBar = bar + shakeSpaces;
        } else {
            // No shake
            displayBar = bar;
        }

        // Clear screen and print new content
        process.stdout.write(this.clearScreen);
        process.stdout.write(displayBar + '\n');
        process.stdout.write(`Progress: ${this.progress}% ${this.isShaking ? '(SHAKING)' : ''}\n`);
    }

    // Demo function to show the bar in action
    demo() {
        // Hide cursor during animation
        process.stdout.write(this.hideCursor);

        console.log('Starting Shaky Progress Bar Demo...');
        console.log('Shaking starts at 50%!');
        console.log('Press Ctrl+C to stop\n');

        let progress = 0;
        const progressInterval = setInterval(() => {
            this.setProgress(progress);
            progress += 2;

            if (progress > 50 && !this.isShaking) {
                this.startShaking();
            }

            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    this.stopShaking();
                    process.stdout.write('\nDemo complete!\n');
                    process.stdout.write(this.showCursor); // Show cursor again
                    process.exit(0);
                }, 2000);
            }
        }, 200);

        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            this.stopShaking();
            clearInterval(progressInterval);
            process.stdout.write('\n\nDemo interrupted!\n');
            process.stdout.write(this.showCursor);
            process.exit(0);
        });
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShakyProgressBar;
}

// Run demo if called directly from command line
if (require.main === module) {
    const bar = new ShakyProgressBar(15, 2); // width 15, original shake intensity 2
    bar.demo();
}

// Example usage:
// const bar = new ShakyProgressBar(20, 2); // width 20, shake intensity 2
// bar.setProgress(50);
// bar.startShaking();
// bar.demo(); // Run the demo

