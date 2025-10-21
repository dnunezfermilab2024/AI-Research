document.addEventListener('DOMContentLoaded', () => {
    const voiceBtn = document.getElementById('voiceBtn');
    const chatOutput = document.getElementById('chatOutput');
    let recognition;

    // Check for browser support of Web Speech API
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false; // Capture a single phrase
        recognition.interimResults = false; // Don't show interim results
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            voiceBtn.textContent = 'Speak now...';
            voiceBtn.disabled = true;
            console.log('Voice recognition started.');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            appendMessage('user', transcript);
            callOllamaAPI(transcript);
        };

        recognition.onend = () => {
            voiceBtn.textContent = 'Start Speaking';
            voiceBtn.disabled = false;
            console.log('Voice recognition ended.');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceBtn.textContent = 'Start Speaking';
            voiceBtn.disabled = false;
        };

    } else {
        voiceBtn.textContent = 'Web Speech API not supported';
        voiceBtn.disabled = true;
        console.error('Web Speech API is not supported by this browser.');
        return;
    }

    voiceBtn.addEventListener('click', () => {
        recognition.start();
    });

    // Function to call the Ollama API
    async function callOllamaAPI(prompt) {
        try {
            // Display a "typing" indicator
            const assistantMessage = appendMessage('assistant', '...');
            
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'phi4-mini:latest', // Ensure this model is pulled in Ollama
                    prompt: prompt,
                    stream: false, // Set to true for streaming, but false is simpler for this example
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            const ollamaResponse = data.response;
            
            // Replace the "typing" indicator with the actual response
            assistantMessage.innerHTML = `<span class="message-assistant">${ollamaResponse}</span>`;

            // Optional: Speak the response using SpeechSynthesis
            speakResponse(ollamaResponse);

        } catch (error) {
            console.error('Failed to call Ollama API:', error);
            appendMessage('assistant', 'Sorry, an error occurred while talking to Ollama.');
        }
    }

    // Function to append messages to the chat window
    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-${sender}`;
        messageDiv.textContent = `${sender === 'user' ? 'You:' : 'Ollama:'} `;
        
        const messageTextSpan = document.createElement('span');
        messageTextSpan.textContent = text;
        messageTextSpan.className = `message-${sender}`;
        
        messageDiv.appendChild(messageTextSpan);
        chatOutput.appendChild(messageDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight; // Auto-scroll to the bottom
        return messageDiv;
    }

    // Function to convert text to speech
    function speakResponse(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported by this browser.');
        }
    }
});
