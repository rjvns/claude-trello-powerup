// Debug version with extensive logging
console.log('🚀 Claude Power-Up: Script loaded successfully');

// Check if TrelloPowerUp is available
if (typeof TrelloPowerUp === 'undefined') {
    console.error('❌ Claude Power-Up: TrelloPowerUp is not defined! Check iframe connector.');
} else {
    console.log('✅ Claude Power-Up: TrelloPowerUp object found');
}

// Wrap everything in a try-catch for debugging
try {
    console.log('📝 Claude Power-Up: Starting initialization...');
    
    var CLAUDE_ICON = 'https://cdn.jsdelivr.net/npm/lucide-static@0.16.29/icons/brain.svg';
    console.log('✅ Claude Power-Up: Icon URL set');

    // Initialize the Power-Up
    window.TrelloPowerUp.initialize({
        // Board buttons
        'board-buttons': function(t, opts) {
            console.log('🔧 Claude Power-Up: board-buttons capability called');
            return [{
                icon: CLAUDE_ICON,
                text: 'Claude Analysis',
                callback: function(t) {
                    console.log('👆 Claude Power-Up: Board analysis button clicked');
                    return t.popup({
                        title: 'Board Analysis',
                        url: './board-analysis.html',
                        height: 500
                    });
                }
            }];
        },

        // Card buttons
        'card-buttons': function(t, opts) {
            console.log('🔧 Claude Power-Up: card-buttons capability called');
            return [{
                icon: CLAUDE_ICON,
                text: 'AI Assist',
                callback: function(t) {
                    console.log('👆 Claude Power-Up: AI Assist button clicked');
                    return t.popup({
                        title: 'AI Assistant',
                        url: './card-assistant.html',
                        height: 400
                    });
                }
            }];
        },

        // Card badges
        'card-badges': function(t, opts) {
            console.log('🔧 Claude Power-Up: card-badges capability called');
            return t.get('card', 'shared', 'complexity')
                .then(function(complexity) {
                    if (complexity) {
                        console.log('📌 Claude Power-Up: Showing complexity badge:', complexity);
                        return [{
                            text: complexity,
                            color: complexity === 'High' ? 'red' : 
                                   complexity === 'Medium' ? 'yellow' : 'green'
                        }];
                    }
                    return [];
                });
        },

        // Settings
        'show-settings': function(t, opts) {
            console.log('🔧 Claude Power-Up: show-settings capability called');
            return t.popup({
                title: 'Claude Settings',
                url: './settings.html',
                height: 200
            });
        }
    }, {
        appKey: 'claude-ai-assistant',
        appName: 'Claude AI Assistant'
    });

    console.log('✅ Claude Power-Up: Initialization complete!');
    
} catch (error) {
    console.error('❌ Claude Power-Up: Initialization failed:', error);
    console.error('Stack trace:', error.stack);
}

// Additional debug info
console.log('📊 Claude Power-Up: Window location:', window.location.href);
console.log('📊 Claude Power-Up: Document readyState:', document.readyState);
console.log('📊 Claude Power-Up: Parent window available:', window.parent !== window);
