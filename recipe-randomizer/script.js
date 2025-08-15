const recipeButton = document.getElementById('get-recipe');
const recipeCard = document.getElementById('recipe-card');
const recipeName = document.getElementById('recipe-name');
const recipeImage = document.getElementById('recipe-image');
const recipeIngredients = document.getElementById('recipe-ingredients');
const recipeInstructions = document.getElementById('recipe-instructions');

console.log('Script loaded');
console.log('Button:', document.getElementById('random-btn'));

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    // Select DOM elements
    const btn = document.getElementById('random-btn');
    const recipeDiv = document.getElementById('recipe');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeLabel = themeToggle.querySelector('.theme-label');
    const body = document.body;
    const installBtn = document.getElementById('install-btn');
    let deferredPrompt = null;

    // ---- THEME TOGGLE LOGIC ----
    // Helper: Set theme and update toggle button label
    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark');
            themeIcon.textContent = '☀️';
            themeLabel.textContent = 'Light Mode';
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            body.classList.remove('dark');
            themeIcon.textContent = '🌙';
            themeLabel.textContent = 'Dark Mode';
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
        // Save theme to localStorage
        localStorage.setItem('theme', theme);
    }

    // On load: check localStorage or system preference
    function getPreferredTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        // Fallback: system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    setTheme(getPreferredTheme());

    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        const isDark = body.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
        // Animate icon rotation (handled by CSS)
    });

    // ---- BUTTON MICRO-INTERACTIONS ----
    // Ripple effect for all buttons
    function createRipple(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        // Calculate size and position
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        button.appendChild(ripple);
        // Remove ripple after animation
        ripple.addEventListener('animationend', () => ripple.remove());
    }
    [btn, themeToggle].forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // ---- RECIPE RANDOMIZER LOGIC ----
    btn.addEventListener('click', getRandomRecipe);

    // Helper: Fade out recipe area
    function fadeOutRecipeArea(cb) {
        recipeDiv.style.transition = 'opacity 0.3s cubic-bezier(.23,1.01,.32,1)';
        recipeDiv.style.opacity = 0;
        setTimeout(() => {
            if (cb) cb();
        }, 300);
    }

    // Helper: Fade in recipe area with animation
    function fadeInRecipeArea() {
        recipeDiv.style.opacity = 1;
        recipeDiv.style.animation = 'none';
        // Force reflow to restart animation
        void recipeDiv.offsetWidth;
        recipeDiv.style.animation = '';
        recipeDiv.classList.remove('loading-state');
    }

    // Show loading spinner/text
    function showLoading() {
        recipeDiv.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">Finding your recipe...</div>
            </div>
        `;
        recipeDiv.classList.add('loading-state');
        recipeDiv.style.opacity = 1;
    }

    function getRandomRecipe() {
        // Fade out current content, then show loading spinner/text
        fadeOutRecipeArea(() => {
            showLoading();
            // Fetch a random recipe from TheMealDB API
            fetch('https://www.themealdb.com/api/json/v1/1/random.php')
                .then(response => response.json())
                .then(data => {
                    // Fade out loading spinner, then show new recipe
                    fadeOutRecipeArea(() => {
                        const meal = data.meals[0];
                        const name = meal.strMeal;
                        const image = meal.strMealThumb;
                        // Gather all ingredients and their measures
                        const ingredients = [];
                        for (let i = 1; i <= 20; i++) {
                            const ingredient = meal[`strIngredient${i}`];
                            const measure = meal[`strMeasure${i}`];
                            if (ingredient && ingredient.trim() !== '') {
                                ingredients.push(`${measure ? measure : ''} ${ingredient}`.trim());
                            }
                        }
                        const instructions = meal.strInstructions;
                        // Build the HTML to display the recipe
                        recipeDiv.innerHTML = `
                            <img src="${image}" alt="Recipe Image">
                            <h2>${name}</h2>
                            <h3>Ingredients:</h3>
                            <ul>
                                ${ingredients.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            <h3>Instructions:</h3>
                            <p>${instructions}</p>
                        `;
                        // Animate image fade-in with a slight delay for a staggered effect
                        const img = recipeDiv.querySelector('img');
                        img.style.transition = 'opacity 0.8s ease-out 0.18s, transform 0.35s cubic-bezier(.23,1.01,.32,1), box-shadow 0.4s, border 0.4s';
                        img.addEventListener('load', () => {
                            setTimeout(() => img.classList.add('loaded'), 180); // 0.18s delay
                        });
                        // If cached, trigger manually
                        if (img.complete) setTimeout(() => img.classList.add('loaded'), 180);
                        // Fade in recipe area with slower slide/fade animation
                        recipeDiv.style.opacity = 1;
                        recipeDiv.style.animation = 'none';
                        void recipeDiv.offsetWidth;
                        recipeDiv.style.animation = '';
                    });
                })
                .catch(error => {
                    // Show offline message if fetch fails (e.g., offline)
                    recipeDiv.innerHTML = `
                        <div class="loading-state">
                            <div class="loading-text" style="color:#e74c3c;">
                                You appear to be offline.<br>
                                New recipes require an internet connection.<br>
                                <span style="font-size:2rem;">📡</span>
                            </div>
                        </div>
                    `;
                    recipeDiv.style.opacity = 1;
                    console.error('Error fetching recipe:', error);
                });
        });
    }

    // ---- PWA INSTALL PROMPT LOGIC ----
    // Listen for the beforeinstallprompt event and show the install button
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'inline-block';
    });

    // Handle install button click
    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(choiceResult => {
                if (choiceResult.outcome === 'accepted') {
                    installBtn.style.display = 'none';
                }
                deferredPrompt = null;
            });
        }
    });

    // Hide install button if app is already installed
    window.addEventListener('appinstalled', () => {
        installBtn.style.display = 'none';
    });

    // Optionally, show a random recipe on first load
    // getRandomRecipe();
});