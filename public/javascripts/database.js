let dbPromise;

const STORIES_DB_NAME = 'stories-db';
const STORIES_STORE_NAME = 'stories-store';
const SAVED_STORIES_STORE_NAME = 'stories-store-saved';
const SAVED_VOTES_STORE_NAME = 'votes-store-saved';

/**
 * Initialize the indexedDB.
 */
function initDatabase() {
    dbPromise = idb.openDB(STORIES_DB_NAME, 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log('Upgrading DB from version', oldVersion, 'to version', newVersion);
            if (!db.objectStoreNames.contains(STORIES_STORE_NAME)) { // for all published stories
                const storyDB = db.createObjectStore(STORIES_STORE_NAME, {keyPath: '_id', autoIncrement: true});
                storyDB.createIndex('_id', '_id', {unique: true});
            }
            if (!db.objectStoreNames.contains(SAVED_STORIES_STORE_NAME)) { // for all stories created offline
                const storyDB = db.createObjectStore(SAVED_STORIES_STORE_NAME, {keyPath: 'id', autoIncrement: true});
                storyDB.createIndex('id', 'id');
            }
            if (!db.objectStoreNames.contains(SAVED_VOTES_STORE_NAME)) { // for all votes created offline
                const storyDB = db.createObjectStore(SAVED_VOTES_STORE_NAME, {keyPath: 'id', autoIncrement: true});
                storyDB.createIndex('id', 'id');
            }
            // window.location.reload();
        },
    });
}

/**
 * Get and cache all published stories.
 */
function cacheAllStories() {
    $.ajax({
        type: 'get',
        url: '/stories',
        success: stories => storeCachedData(stories)
    });
}

/**
 * It saves the stories in localStorage
 * @param stories - The stories going to be stored.
 */
function storeCachedData(stories) {
    if (dbPromise) {
        dbPromise.then(async db => {
            const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORIES_STORE_NAME);
            for (let story of stories)
                await store.put(story);
            return tx.done;
        })
            .then(() => console.log('Added stories to the store!', stories.length, 'stories!'))
            .catch(error => {
                console.log(error);
                localStorage.setItem('stories', JSON.stringify(stories));
            });
    } else
        localStorage.setItem('stories', JSON.stringify(stories));
}

/**
 * Show saved stories on web.
 */
function showSavedStories() {
    if (dbPromise) {
        dbPromise.then(db => {
            console.log('fetching saved stories ');
            const tx = db.transaction(SAVED_STORIES_STORE_NAME, 'readonly');
            const store = tx.objectStore(SAVED_STORIES_STORE_NAME);
            const index = store.index('id');
            return index.getAll();
        }).then(stories => {
            if (stories)
                showStories(stories, false, true);
            else {
                let stories = JSON.parse(localStorage.getItem('stories'));
                showStories(stories, false, true);
            }
        });
    } else {
        let stories = JSON.parse(localStorage.getItem('stories'));
        showStories(stories, false, true);
    }
}

/**
 * Search cached stories and saved stories.
 * @param {string} keyword - The word which will be searched.
 */
function searchOffline(keyword) {
    if (dbPromise) {
        let stories = [];
        dbPromise.then(db => {
            console.log('searching offline stories');
            const tx = db.transaction(STORIES_STORE_NAME, 'readonly');
            const store = tx.objectStore(STORIES_STORE_NAME);
            return store.openCursor();
        }).then(function searchText(cursor) {
            if (!cursor)
                return;
            if (cursor.value.text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
                stories.push(cursor.value);
            return cursor.continue().then(searchText);
        }).then(function () {
            showStories(stories);
            searchOfflineSaved(keyword);
            hideWaitModal();
        });
    } else {
        let search_stories = [];
        let stories = JSON.parse(localStorage.getItem('stories'));
        for (let story of stories) {
            if (story.text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
                search_stories.push(story);
        }
        showStories(search_stories);

        search_stories = [];
        stories = JSON.parse(localStorage.getItem('saved_stories')) || [];
        for (let story of stories) {
            if (story.text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
                search_stories.push(story);
        }
        showStories(search_stories, false, true);
    }
}

/**
 * Search saved stories.
 * @param {string} keyword - The word which will be searched.
 */
function searchOfflineSaved(keyword) {
    if (dbPromise) {
        let saved_stories = []
        dbPromise.then(db => {
            console.log('searching saved stories ');
            const tx = db.transaction(SAVED_STORIES_STORE_NAME, 'readonly');
            const store = tx.objectStore(SAVED_STORIES_STORE_NAME);
            return store.openCursor();
        }).then(function searchText(cursor) {
            if (!cursor) {
                return;
            }
            if (cursor.value.text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                saved_stories.push(cursor.value);
            }
            return cursor.continue().then(searchText);
        }).then(function () {
            showStories(saved_stories, false, true);
            hideWaitModal();
        });
    }
}

let pics = [];
let picsReady = false;

/**
 * Convert files to base64 strings.
 */
function convertFiles() {
    pics = [];
    picsReady = false;
    let files = $('#pictures').prop('files');
    for (let i = 0; i < files.length; i++) {
        let reader = new FileReader();
        reader.readAsDataURL(files[i]);
        reader.onload = () => {
            pics.push(reader.result);
            if (i === files.length - 1)
                picsReady = true;
        };
    }
}

/**
 * Store saved stories after pictures were all converted.
 */
function storeSavedStory() {
    if (picsReady) {
        picsReady = false;

        const story = {
            text: $('#new_story').val(),
            pics: pics
        };

        storeSavedStoryAgain(story);
        return;
    }

    setTimeout(storeSavedStory, 1000);
}

/**
 * Save story into indexedDB or local storage.
 * @param story - The story going to be saved.
 */
function storeSavedStoryAgain(story) {
    if (dbPromise) {
        dbPromise.then(async db => {
            const tx = db.transaction(SAVED_STORIES_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SAVED_STORIES_STORE_NAME);
            await store.put(story);
            return tx.done;
        })
            .then(() => console.log('Saved story into indexedDB!'))
            .catch(function (error) {
                let stories = JSON.parse(localStorage.getItem('saved_stories')) || [];
                stories.push(story);
                localStorage.setItem('saved_stories', JSON.stringify(stories));
            });
    } else {
        let stories = JSON.parse(localStorage.getItem('saved_stories')) || [];
        stories.push(story);
        localStorage.setItem('saved_stories', JSON.stringify(stories));
    }
}

/**
 * Clear all saved stories.
 */
function clearSavedStories() {
    if (dbPromise) {
        dbPromise.then(async db => {
            const tx = db.transaction(SAVED_STORIES_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SAVED_STORIES_STORE_NAME);
            await store.clear();
            return tx.done;
        })
            .then(() => console.log('Cleared saved stories.'))
            .catch(error => console.log(error));
    }
}

/**
 * Save vote into indexedDB or local storage.
 * @param vote - The vote going to be saved.
 */
function storeVote(vote) {
    if (dbPromise) {
        dbPromise.then(async db => {
            const tx = db.transaction(SAVED_VOTES_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SAVED_VOTES_STORE_NAME);
            await store.put(vote);
            return tx.done;
        })
            .then(() => console.log('Saved vote into indexedDB!'))
            .catch(function (error) {
                localStorage.setItem('saved_vote', JSON.stringify(vote));
            });
    } else {
        localStorage.setItem('saved_vote', JSON.stringify(vote));
    }
}

/**
 * Clear all saved votes.
 */
function clearSavedVotes() {
    if (dbPromise) {
        dbPromise.then(async db => {
            const tx = db.transaction(SAVED_VOTES_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SAVED_VOTES_STORE_NAME);
            await store.clear();
            return tx.done;
        })
            .then(() => console.log('Cleared saved votes.'))
            .catch(error => console.log(error));
    }
}

/**
 * Sync with server for saved stories and votes when back online.
 */
function reSync() {
    if (dbPromise) {
        dbPromise.then(db => {
            const tx = db.transaction(SAVED_STORIES_STORE_NAME, 'readonly');
            const store = tx.objectStore(SAVED_STORIES_STORE_NAME);
            const index = store.index('id');
            return index.getAll();
        }).then(stories => {
            if (stories) {
                clearSavedStories();
                for (let story of stories)
                    syncStory(story);
            } else {
                let stories = JSON.parse(localStorage.getItem('saved_stories')) || [];
                localStorage.removeItem('saved_stories');
                for (let story of stories)
                    syncStory(story);
            }
        });
    } else {
        let stories = JSON.parse(localStorage.getItem('saved_stories')) || [];
        localStorage.removeItem('saved_stories');
        for (let story of stories)
            syncStory(story);
    }
    cacheAllStories();
    if (dbPromise) {
        dbPromise.then(db => {
            const tx = db.transaction(SAVED_VOTES_STORE_NAME, 'readonly');
            const store = tx.objectStore(SAVED_VOTES_STORE_NAME);
            const index = store.index('id');
            return index.getAll();
        }).then(votes => {
            if (votes) {
                clearSavedVotes();
                for (let vote of votes)
                    syncVote(vote);
            } else {
                let vote = JSON.parse(localStorage.getItem('saved_vote'));
                localStorage.removeItem('saved_vote');
                syncVote(vote);
            }
        });
    } else {
        let vote = JSON.parse(localStorage.getItem('saved_vote'));
        localStorage.removeItem('saved_vote');
        syncVote(vote);
    }
}

/**
 * Sync with server for one story.
 * @param story - The story going to be synced.
 */
function syncStory(story) {
    const formData = new FormData();
    formData.append('new_story', story.text);
    let pics = story.pics;
    for (let pic of pics) {
        let file = dataURItoFile(pic);
        formData.append('pictures', file);
    }
    $.ajax({
        type: 'post',
        url: '/stories',
        contentType: false,
        processData: false,
        data: formData,
        success: function (data) {
            if (data.status < 0) {
                return;
            }
            const socket = io('/');
            socket.emit('new', data.id);
        }, error: function (err) {
            storeSavedStoryAgain(story);
            console.log(err);
        }
    });
}

/**
 * Sync with server for one vote.
 * @param vote - The vote going to be synced.
 */
function syncVote(vote) {
    $.ajax({
        type: 'post',
        url: '/votes',
        contentType: 'application/json',
        data: JSON.stringify(vote),
        success: function (data) {
        }, error: function (err) {
            storeVote(vote);
            console.log(err);
        }
    });
}

/**
 * Convert data uri to file.
 * @param {string} dataURI - The base64 string going to be converted.
 * @returns {File} - The converted file.
 */
function dataURItoFile(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // return new Blob([ia], {type: mimeString});
    return new File([new Blob([ia], {type: mimeString})], 'offlineImage', {type: mimeString});
}
