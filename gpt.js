console.log("Zonix Music Player");

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let songs = [];
let currentSongIndex = -1;
let currentSong = new Audio();


// ==========================================
// GET SONGS FROM SERVER
// ==========================================

async function getSongs() {
    try {
        const response = await fetch("http://127.0.0.1:3000/songs/");

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const html = await response.text();

        const div = document.createElement("div");
        div.innerHTML = html;

        const links = div.getElementsByTagName("a");

        const songList = [];

        for (const link of links) {
            const href = link.href;

            if (href.toLowerCase().includes(".mp3")) {
                songList.push(href);
            }
        }

        return songList;

    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}


// ==========================================
// GET CLEAN SONG NAME
// ==========================================

function getSongName(songUrl) {

    let path = String(songUrl);

    // Decode %20, %5C etc.
    try {
        path = decodeURIComponent(path);
    } catch (error) {
        console.log("URL decode error:", error);
    }

    // Convert Windows backslash to slash
    path = path.replace(/\\/g, "/");

    // Remove everything before /songs/
    const songsIndex = path.toLowerCase().lastIndexOf("/songs/");

    if (songsIndex !== -1) {
        path = path.substring(songsIndex + 7);
    }

    // Remove anything before last slash
    path = path.split("/").pop();

    return path.trim();
}


// ==========================================
// PLAY SONG
// ==========================================

async function playMusic(index) {

    if (index < 0 || index >= songs.length) {
        return;
    }

    // If a different song is selected
    if (currentSongIndex !== index) {

        currentSong.pause();

        currentSong.currentTime = 0;

        currentSong.src = songs[index];

        currentSongIndex = index;

        currentSong.load();

        updateSongInfo();
    }

    try {

        await currentSong.play();

        updatePlayButton();

    } catch (error) {

        console.error("Unable to play song:", error);

    }
}


// ==========================================
// PAUSE SONG
// ==========================================

function pauseMusic() {

    if (!currentSong.src) {
        return;
    }

    currentSong.pause();

    updatePlayButton();
}


// ==========================================
// PLAY / PAUSE TOGGLE
// ==========================================

function togglePlayPause() {

    // No song selected
    if (currentSongIndex === -1) {

        if (songs.length > 0) {
            playMusic(0);
        }

        return;
    }

    if (currentSong.paused) {
        playMusic(currentSongIndex);
    } else {
        pauseMusic();
    }
}


// ==========================================
// STOP SONG
// ==========================================

function stopMusic() {

    currentSong.pause();

    currentSong.currentTime = 0;

    updatePlayButton();
    updateSeekbar();
    updateSongTimer();
}


// ==========================================
// NEXT SONG
// ==========================================

function nextSong() {

    if (songs.length === 0) {
        return;
    }

    if (currentSongIndex === -1) {

        playMusic(0);

        return;
    }

    let nextIndex = currentSongIndex + 1;

    // Loop back to first song
    if (nextIndex >= songs.length) {
        nextIndex = 0;
    }

    playMusic(nextIndex);
}


// ==========================================
// PREVIOUS SONG
// ==========================================

function previousSong() {

    if (songs.length === 0) {
        return;
    }

    if (currentSongIndex === -1) {

        playMusic(0);

        return;
    }

    let previousIndex = currentSongIndex - 1;

    // Loop to last song
    if (previousIndex < 0) {
        previousIndex = songs.length - 1;
    }

    playMusic(previousIndex);
}


// ==========================================
// DISPLAY CURRENT SONG
// ==========================================

function updateSongInfo() {

    const songInfo = document.querySelector(".songInfo");

    if (!songInfo || currentSongIndex === -1) {
        return;
    }

    const songName = getSongName(songs[currentSongIndex]);

    songInfo.innerHTML = `
        <div>${songName}</div>
        <div>Zonix</div>
    `;
}


// ==========================================
// UPDATE PLAY BUTTON
// ==========================================

function updatePlayButton() {

    const playButton = document.querySelector(
        ".songbuttons img:nth-child(2)"
    );

    if (!playButton) {
        return;
    }

    if (currentSong.paused) {

        playButton.src = "playbar.svg/play.svg";
        playButton.alt = "Play";

    } else {

        playButton.src = "playbar.svg/pause.svg";
        playButton.alt = "Pause";

    }
}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes =
        minutes < 10 ? "0" + minutes : minutes;

    const formattedSeconds =
        remainingSeconds < 10
            ? "0" + remainingSeconds
            : remainingSeconds;

    return `${formattedMinutes}:${formattedSeconds}`;
}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateSongTimer() {

    const songTimer = document.querySelector(".songTimer");

    if (!songTimer) {
        return;
    }

    songTimer.innerHTML = `
        ${formatTime(currentSong.currentTime)}
        /
        ${formatTime(currentSong.duration)}
    `;
}


// ==========================================
// UPDATE SEEKBAR
// ==========================================

function updateSeekbar() {

    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

    if (!seekbar || !circle) {
        return;
    }

    if (!currentSong.duration) {

        circle.style.left = "0%";

        return;
    }

    const percentage =
        (currentSong.currentTime / currentSong.duration) * 100;

    circle.style.left = `${percentage}%`;
}


// ==========================================
// SEEK SONG
// ==========================================

function setupSeekbar() {

    const seekbar = document.querySelector(".seekbar");

    if (!seekbar) {
        return;
    }

    seekbar.addEventListener("click", (event) => {

        if (!currentSong.duration) {
            return;
        }

        const rect = seekbar.getBoundingClientRect();

        const clickPosition =
            event.clientX - rect.left;

        let percentage =
            clickPosition / rect.width;

        // Keep value between 0 and 1
        percentage = Math.max(0, Math.min(1, percentage));

        currentSong.currentTime =
            percentage * currentSong.duration;
    });
}


// ==========================================
// DISPLAY ALL SONGS IN YOUR LIBRARY
// ==========================================

function displaySongs() {

    const songUl = document
        .querySelector(".songList")
        ?.querySelector("ul");

    if (!songUl) {
        console.error("Song list <ul> not found.");

        return;
    }

    songUl.innerHTML = "";

    songs.forEach((song, index) => {

        const songName = getSongName(song);

        songUl.innerHTML += `
            <li data-index="${index}">

                <img src="music.svg" alt="music">

                <div class="songinfo">

                    <div>${songName}</div>

                    <div>Song Artist</div>

                </div>

                <div class="playnow">

                    <span>Play Now</span>

                    <img
                        class="invert"
                        src="allSvgs/playList.svg"
                        alt="Play"
                    >

                </div>

            </li>
        `;
    });


    // ======================================
    // ADD CLICK EVENT TO EACH SONG
    // ======================================

    const songItems = songUl.querySelectorAll("li");

    songItems.forEach((songItem) => {

        songItem.addEventListener("click", () => {

            const index =
                Number(songItem.dataset.index);

            // Same song -> pause/resume
            if (currentSongIndex === index) {

                if (currentSong.paused) {

                    playMusic(index);

                } else {

                    pauseMusic();

                }

            } else {

                // Different song
                playMusic(index);

            }
        });
    });
}


// ==========================================
// PLAYBAR BUTTONS
// ==========================================

function setupPlaybarButtons() {

    const buttons =
        document.querySelectorAll(".songbuttons img");

    if (buttons.length < 3) {

        console.error(
            "Previous / Play / Next buttons not found."
        );

        return;
    }

    const previousButton = buttons[0];

    const playButton = buttons[1];

    const nextButton = buttons[2];


    // Previous
    previousButton.addEventListener("click", (event) => {

        event.stopPropagation();

        previousSong();
    });


    // Play / Pause
    playButton.addEventListener("click", (event) => {

        event.stopPropagation();

        togglePlayPause();
    });


    // Next
    nextButton.addEventListener("click", (event) => {

        event.stopPropagation();

        nextSong();
    });
}


// ==========================================
// AUDIO EVENTS
// ==========================================


// Song playing
currentSong.addEventListener("play", () => {

    updatePlayButton();

});


// Song paused
currentSong.addEventListener("pause", () => {

    updatePlayButton();

});


// Song time changes
currentSong.addEventListener("timeupdate", () => {

    updateSongTimer();

    updateSeekbar();

});


// Song metadata loaded
currentSong.addEventListener("loadedmetadata", () => {

    updateSongTimer();

});


// Song ended
currentSong.addEventListener("ended", () => {

    nextSong();

});


// Audio error
currentSong.addEventListener("error", () => {

    console.error(
        "Audio could not be loaded:",
        currentSong.src
    );

});


// ==========================================
// MAIN FUNCTION
// ==========================================

async function main() {

    console.log("Loading songs...");

    songs = await getSongs();

    console.log("Songs found:", songs);


    // No songs
    if (songs.length === 0) {

        console.log("No MP3 files found.");

        return;
    }


    // Show songs
    displaySongs();


    // Setup playbar
    setupPlaybarButtons();


    // Setup seekbar
    setupSeekbar();


    // Initial UI
    updatePlayButton();

    updateSongTimer();

    updateSeekbar();
}


// ==========================================
// START PLAYER
// ==========================================

main();