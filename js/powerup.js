// Claude AI Power-Up for Trello
// This creates a native Trello Power-Up with Claude integration

// Power-Up manifest and initialization
const POWERUP_NAME = 'Claude AI Assistant';
const POWERUP_ID = 'claude-ai-assistant';

// Initialize the Power-Up
window.TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return [{
      icon: 'https://cdn.jsdelivr.net/gh/anthropic/claude-assets@main/claude-icon.svg',
      text: 'Claude Analysis',
      callback: function(t) {
        return t.popup({
          title: 'Claude AI Board Analysis',
          url: './board-analysis.html',
          height: 500
        });
      }
    }];
  },

  'card-buttons': function(t, options) {
    return [{
      icon: 'https://cdn.jsdelivr.net/gh/anthropic/claude-assets@main/claude-icon.svg',
      text: 'AI Assist',
      callback: function(t) {
        return t.popup({
          title: 'Claude AI Card Assistant',
          url: './card-assistant.html',
          height: 600
        });
      }
    }, {
      icon: 'https://img.icons8.com/material-outlined/24/000000/divide.png',
      text: 'Break Down Task',
      callback: function(t) {
        return breakDownTask(t);
      }
    }];
  },

  'card-detail-badges': function(t, options) {
    return t.card('all')
      .then(function(card) {
        return [{
          title: 'AI Complexity',
          text: getComplexityBadge(card),
          color: getComplexityColor(card)
        }];
      });
  },

  'show-settings': function(t, options) {
    return t.popup({
      title: 'Claude AI Settings',
      url: './settings.html',
      height: 300
    });
  }
});

// Core Claude API integration
class ClaudeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  async callClaude(prompt, maxTokens = 1000) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }
}

// Power-Up Functions
async function breakDownTask(t) {
  try {
    const card = await t.card('all');
    const apiKey = await t.get('member', 'private', 'claudeApiKey');
    
    if (!apiKey) {
      return t.popup({
        title: 'Setup Required',
        url: './settings.html'
      });
    }

    const claude = new ClaudeAPI(apiKey);
    
    const prompt = `
    Break down this Trello card into 3-5 smaller, actionable subtasks:
    
    Title: ${card.name}
    Description: ${card.desc || 'No description provided'}
    
    Return a JSON array of objects with this format:
    [
      {
        "task": "Specific actionable task",
        "description": "Brief description of what needs to be done",
        "estimatedTime": "2h"
      }
    ]
    
    Make sure each subtask is:
    - Specific and actionable
    - Can be completed in one sitting
    - Has a clear outcome
    `;

    const response = await claude.callClaude(prompt, 800);
    
    try {
      // Parse the JSON response
      const subtasks = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      
      // Create a checklist with the subtasks
      const checklistName = `AI Breakdown - ${new Date().toLocaleDateString()}`;
      
      // Note: In a real Power-Up, you'd use Trello's API to create checklists
      // For this demo, we'll show the results in a popup
      return t.popup({
        title: 'Task Breakdown Complete',
        items: subtasks.map(subtask => ({
          text: `${subtask.task} (${subtask.estimatedTime})`,
          callback: function(t) {
            // Add this as a comment or checklist item
            return t.closePopup();
          }
        }))
      });
      
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return t.popup({
        title: 'Task Breakdown',
        url: './breakdown-result.html?result=' + encodeURIComponent(response)
      });
    }
    
  } catch (error) {
    console.error('Task breakdown failed:', error);
    return t.notice('Failed to break down task. Check your Claude API key.', 'error');
  }
}

function getComplexityBadge(card) {
  // Simple heuristic for task complexity
  const descLength = (card.desc || '').length;
  const checklistItems = (card.checklists || []).reduce((total, list) => total + list.checkItems.length, 0);
  const memberCount = (card.idMembers || []).length;
  
  const complexity = descLength + (checklistItems * 10) + (memberCount * 5);
  
  if (complexity > 200) return 'High';
  if (complexity > 100) return 'Med';
  return 'Low';
}

function getComplexityColor(card) {
  const badge = getComplexityBadge(card);
  return badge === 'High' ? 'red' : badge === 'Med' ? 'yellow' : 'green';
}

// Board Analysis Functions
async function analyzeBoardHealth(t) {
  try {
    const apiKey = await t.get('member', 'private', 'claudeApiKey');
    if (!apiKey) {
      throw new Error('Claude API key not configured');
    }

    const board = await t.board('all');
    const lists = await t.lists('all');
    const cards = await t.cards('all');
    
    const boardData = {
      name: board.name,
      totalCards: cards.length,
      lists: lists.map(list => ({
        name: list.name,
        cardCount: cards.filter(card => card.idList === list.id).length
      })),
      overdueTasks: cards.filter(card => card.due && new Date(card.due) < new Date()).length,
      completedTasks: cards.filter(card => card.closed).length
    };

    const claude = new ClaudeAPI(apiKey);
    
    const analysisPrompt = `
    Analyze this Trello board and provide insights:
    
    ${JSON.stringify(boardData, null, 2)}
    
    Provide a concise analysis covering:
    1. Overall project health (1-2 sentences)
    2. Workflow bottlenecks (which lists have too many cards)
    3. Key recommendations (2-3 actionable items)
    
    Keep it under 200 words and focus on actionable insights.
    `;

    const analysis = await claude.callClaude(analysisPrompt, 500);
    
    return {
      boardData,
      analysis
    };
    
  } catch (error) {
    console.error('Board analysis failed:', error);
    throw error;
  }
}

// Smart card suggestions
async function getCardSuggestions(t, cardData) {
  try {
    const apiKey = await t.get('member', 'private', 'claudeApiKey');
    if (!apiKey) return null;

    const claude = new ClaudeAPI(apiKey);
    
    const prompt = `
    Suggest improvements for this Trello card:
    
    Title: ${cardData.name}
    Description: ${cardData.desc || 'No description'}
    Due Date: ${cardData.due || 'Not set'}
    Members: ${cardData.idMembers?.length || 0}
    
    Provide 2-3 brief, actionable suggestions to improve this card:
    - Better title/description
    - Missing information
    - Process improvements
    
    Keep each suggestion to one sentence.
    `;

    const suggestions = await claude.callClaude(prompt, 300);
    return suggestions;
    
  } catch (error) {
    console.error('Failed to get card suggestions:', error);
    return null;
  }
}

// Export for use in popup windows
window.ClaudePowerUp = {
  ClaudeAPI,
  analyzeBoardHealth,
  getCardSuggestions,
  breakDownTask
};
