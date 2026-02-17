# Soothing Background Audio Setup

## Required Audio File

To enable the calming background music on the homepage, you need to add a soothing audio file.

### Steps:

1. **Find or Create a Soothing Audio File**
   - Use royalty-free calming music (nature sounds, ambient music, meditation sounds)
   - Recommended sources:
     - [Pixabay Audio](https://pixabay.com/music/)
     - [Free Music Archive](https://freemusicarchive.org/)
     - [Incompetech](https://incompetech.com/)
     - [YouTube Audio Library](https://www.youtube.com/audiolibrary)

2. **Prepare the Audio File**
   - Format: MP3 (recommended for browser compatibility)
   - File size: Keep under 5MB for faster loading
   - Duration: 2-5 minutes (it will loop automatically)
   - Volume: Ensure it's normalized and not too loud

3. **Place the Audio File**
   - Save your audio file as `soothing.mp3`
   - Place it in: `frontend/public/soothing.mp3`
   - The file path should be: `C:\Projects\SereneSpace\frontend\public\soothing.mp3`

4. **Verify Setup**
   - Start the frontend server: `npm start`
   - Navigate to the homepage
   - The audio should attempt to autoplay
   - Use the floating "Play/Pause Music" button in the bottom-right corner

### Audio Recommendations:

**Calming Nature Sounds:**
- Ocean waves
- Rain sounds
- Forest ambience
- Gentle stream

**Ambient Music:**
- Soft piano melodies
- Meditation music
- Binaural beats (alpha/theta waves)
- Tibetan singing bowls

### Browser Autoplay Policy:

Most modern browsers restrict autoplay with sound. The implementation handles this gracefully:
- If autoplay is allowed, music starts automatically
- If blocked, a message prompts the user to click "Play Music"
- The button provides full control over playback

### Troubleshooting:

**No sound playing:**
- Check that `soothing.mp3` exists in `frontend/public/` directory
- Verify the file is a valid MP3 format
- Check browser console for errors
- Try clicking the "Play Music" button manually

**Audio file not found error:**
- Ensure the file is named exactly `soothing.mp3` (case-sensitive on some systems)
- Verify it's in the `public` folder, not `src`
- Restart the development server after adding the file

---

*Note: The audio plays only on the homepage and automatically stops when navigating to other pages.*
