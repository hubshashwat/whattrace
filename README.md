# 💠 WhatTrace - Advanced WhatsApp Chat Analyzer

<div align="center">

**Analyze your WhatsApp conversations with stunning visualizations and deep insights!**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub stars](https://img.shields.io/github/stars/hubshashwat/whattrace?style=social)](https://github.com/hubshashwat/whattrace)

### 🛡️ **Client-Side Only: Your Data Never Leaves Your Device**

[⭐ Star on GitHub](https://github.com/hubshashwat/whattrace) | [🤝 Contributing](#-contributing)

</div>

---

## 👻 Are You Being Ghosted? Find Out!

Ever wonder if that "busy" excuse is legit? WhatTrace exposes the **cold, hard truth** about your conversations:

### 🔍 **Ghost Detection**
- See exactly **how long they left you on read** 
- Track ghosting patterns — is it always after you ask "what are we?"
- Identify **who ghosts more** in your conversations
- Get stats on those 24-hour+ silent treatments 💀

### ⏰ **Optimal Time to Text**
- Discover **when they actually reply fastest** (spoiler: probably not 3 AM)
- Find their peak response windows by hour
- Stop texting at times when you'll be left on read
- **Pro tip**: The data doesn't lie, but your situationship might 😅

---

## ✨ Features

### 📊 **Comprehensive Analytics**
- **Response Time Analysis** - Average, median, and distribution of response times
- **Individual Response Patterns** - Per-participant response time breakdown
- **Conversation Initiators** - Who starts conversations more often
- **Best Time to Message** - Optimal response windows by hour
- **Conversation Enders** - Who tends to end conversations

### 💬 **Conversation Dynamics**
- **Double Texting Analysis** - Track consecutive messages (2x, 3x, 4x+)
- **Ghost Periods** - Identify ghosting patterns and durations
- **Streak Analysis** - Longest and average conversation streaks
- **Conversation Gaps** - Track periods of silence

### 📝 **Content Insights**
- **Keyword Clusters** - Top words with smart stopword filtering
- **Emoji Sentiment** - Most used emojis with frequency
- **Message Length Stats** - Average characters and words per participant
- **Punctuation Analysis** - Questions and exclamations tracker
- **Media Sharing** - Track shared images, videos, and documents

### ⏰ **Temporal Patterns**
- **24-Hour Activity Heatmap** - Hourly messaging patterns
- **Day of Week Trends** - Which days are most active
- **Monthly Trajectory** - Long-term conversation trends
- **Activity Personas** - Night Owl, Morning Person, etc.
- **Peak Activity Times** - Busiest hours and days

### 🎨 **Futuristic UI/UX**
- **Dark Glassmorphism Theme** - Premium neon-accented interface
- **Interactive Charts** - Built with Chart.js
- **Mobile-Optimized** - Fully responsive design
- **Smooth Animations** - Tilt effects and shimmer animations
- **Intuitive Navigation** - HUD-style statistics display

---

## 🚀 Quick Start

### Prerequisites
- Python 3.x OR Node.js
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

**Option 1: Using Python (Recommended)**
```bash
# Clone the repository
git clone https://github.com/yourusername/whatsapp-chat-analyzer.git
cd whatsapp-chat-analyzer

# Start local server
python -m http.server 8000

# Open browser
# Navigate to: http://localhost:8000
```

**Option 2: Using Node.js**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

---

## 📱 How to Export Your Chat

### Android
1. Open WhatsApp
2. Go to the chat you want to analyze
3. Tap **⋮** (three dots) → **More** → **Export chat**
4. Choose **"Without media"**
5. Save the `.txt` file

### iPhone
1. Open WhatsApp
2. Go to the chat you want to analyze
3. Tap the contact/group name at the top
4. Scroll down → **Export Chat**
5. Choose **"Without Media"**
6. Save the file (`.txt` or `.zip`)

### Upload to WhatTrace
- Supports both `.txt` and `.zip` files
- Works with Android AND iPhone formats
- Drag & drop or click to upload

---

## 🔒 Privacy & Security

**100% Privacy Guaranteed**
- ✅ All processing happens **locally in your browser**
- ✅ **No server uploads** - your data never leaves your device
- ✅ **No tracking or analytics**
- ✅ **No data storage** - everything is cleared on page refresh
- ✅ **Open source** - audit the code yourself

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Charts**: Chart.js 4.4.0 with date-fns adapter
- **Styling**: Pure CSS with glassmorphism
- **Effects**: Vanilla-Tilt.js
- **Fonts**: Google Fonts (Outfit, Space Grotesk)

---

## 🤝 Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements.

### How to Contribute

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/whatsapp-chat-analyzer.git
   cd whatsapp-chat-analyzer
   ```

3. **Create a new branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Follow the existing code style
   - Test your changes thoroughly
   - Update documentation if needed

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: amazing new feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes

### Development Guidelines

- **Code Style**: Use clean, readable JavaScript with meaningful variable names
- **Comments**: Add comments for complex logic
- **Testing**: Test with both Android and iPhone chat exports
- **Mobile**: Ensure changes work on mobile devices
- **Performance**: Keep the app fast and lightweight

### Ideas for Contributions

- 🌍 Multi-language support for stopwords
- 📊 New analytics metrics (sentiment analysis, typing patterns)
- 🎨 Additional UI themes
- 📈 Export analysis to PDF/CSV
- 🔍 Search functionality within chats
- 🌙 Light mode theme
- ♿ Accessibility improvements

---

## 📂 Project Structure

```
whatsapp-chat-analyzer/
├── index.html          # Main HTML structure
├── styles.css          # Glassmorphism styling
├── app.js             # Main application orchestrator
├── parser.js          # WhatsApp chat parser (Android + iPhone)
├── analytics.js       # Analytics engine
├── visualizations.js  # Chart.js visualizations
├── utils.js           # Utility functions
└── README.md          # You are here!
```

---

## 🐛 Bug Reports & Feature Requests

Found a bug? Have an idea? We'd love to hear from you!

- **Bug Reports**: [Open an issue](https://github.com/yourusername/whatsapp-chat-analyzer/issues) with details
- **Feature Requests**: [Start a discussion](https://github.com/yourusername/whatsapp-chat-analyzer/discussions)
- **Questions**: Check existing issues or ask in discussions

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Star History

If you find this project useful, consider giving it a ⭐️ on GitHub!

---

## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts
- **Vanilla-Tilt.js** - Smooth 3D effects
- **Google Fonts** - Typography
- All our **contributors** - Thank you! 💙

---

<div align="center">

**Made with ❤️ for better understanding your conversations**

[⬆ back to top](#-whattrace---advanced-whatsapp-chat-analyzer)

</div>
