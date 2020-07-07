/**
 * Initialize sodia.
 */
function initSodia() {
    if ('serviceWorker' in navigator) { // register service worker
        navigator.serviceWorker
            .register('/service-worker.js')
            .then(() => {
                console.log('Service Worker Registered');
                cachePages();
            })
            .catch(error => console.log('Service Worker NOT Registered ' + error.message));
    }
    if ('indexedDB' in window) { // check indexedDB
        initDatabase();
        cacheAllStories();
    } else {
        console.log('This browser doesn\'t support IndexedDB');
    }
}

/**
 * Sleep function.
 * @param {number} time - Time in millisecond.
 */
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Show login modal.
 */
function showLoginModal() {
    $('#loginModal').modal('show');
}

/**
 * Hide login modal.
 */
function hideLoginModal() {
    $('#loginModal').modal('hide');
}

/**
 * Show waiting modal.
 */
function showWaitModal() {
    $('#waitModal').modal('show');
}

/**
 * Hide waiting modal.
 */
function hideWaitModal() {
    $('#waitModal').modal('hide'); //We have to try again later in case it does not hide
    sleep(500).then(() => { //If we show and hide it in 0.5s it will not hide
        $('#waitModal').modal('hide'); //Because when we hide it, its status is still 'hide' even it shows
    }); //The 'show' animation needs about 0.5s to finish, then change its status from 'hide' to 'show'
}

/**
 * Show confirmation modal.
 * @param callback - The callback function.
 * @param data - The data going to be passed to callback function.
 */
function confirmAction(callback, data) {
    const modal = $('#confirmModal');
    modal.modal('show');
    modal.find('#primary_button').off('click').on('click', () => {
        $('#confirmModal').modal('hide');
        callback(data);
    });
}

/**
 * Show message modal with specific message.
 * @param {string} data - The message going to be shown in message modal.
 * @param {boolean} success - Boolean for if success status.
 * @param redirect - The link need to redirect after message modal.
 */
function message(data, success, redirect = null) {
    const modal = $('#messageModal');
    const confirm_button = modal.find('#primary_button');
    if (success) {
        modal.find('.modal-title').text('Succeeded');
        confirm_button.removeClass('btn-warning').addClass('btn-success');
    } else {
        modal.find('.modal-title').text('Failed');
        confirm_button.removeClass('btn-success').addClass('btn-warning');
    }
    modal.find('.modal-body p').text(data);
    hideWaitModal();
    modal.modal('show');
    confirm_button.off('click').on('click', () => {
        $('#messageModal').modal('hide');
        if (redirect) {
            showWaitModal();
            window.location.href = redirect;
        }
    });
}

/**
 * Show offline waring.
 */
function showOfflineWarning() {
    $('#offline_div').show();
}

/**
 * Hide offline warning.
 */
function hideOfflineWarning() {
    $('#offline_div').hide();
}

/**
 * When the client gets offline, it shows an offline warning to the user,
 * so that it is clear that the data is stale.
 */
window.addEventListener('offline', function (e) {
    // Queue up events for server.
    console.log('You are offline now.');
    showOfflineWarning();
}, false);

/**
 * When the client gets online, it hides the offline warning.
 */
window.addEventListener('online', function (e) {
    reSync();
    console.log('You are online now.');
    hideOfflineWarning();
}, false);

/**
 * Register function. It grabs the register information from register modal,
 * and post them to server.
 */
function reg() {
    event.preventDefault();
    showWaitModal();
    const form = $('#regForm');
    const regInfo = {
        email: form.find('#emailReg').val(),
        user_id: form.find('#user_id').val(),
        nickname: form.find('#nickname').val(),
        password: form.find('#passwordReg').val(),
        passwordAgain: form.find('#passwordAgain').val()
    };
    $.ajax({
        type: 'post',
        url: '/reg',
        contentType: 'application/json',
        data: JSON.stringify(regInfo),
        success: data => {
            if (data.status < 0) {
                message(data.message, false);
                return;
            }
            hideLoginModal();
            message('Succeeded!', true, data.redirect);
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * Login function. It grabs the login information from login modal,
 * and post them to server.
 */
function login() {
    event.preventDefault();
    showWaitModal();
    const form = $('#loginModal');
    const email = form.find('#email').val();
    const password = form.find('#password').val();
    $.ajax({
        type: 'post',
        url: '/login',
        contentType: 'application/json',
        data: JSON.stringify({email: email, password: password}),
        success: data => {
            if (data.status < 0) {
                message(data.message, false);
                return;
            }
            hideLoginModal();
            message('Succeeded!', true, data.redirect);
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * It will logout the current user.
 */
function logout() {
    event.preventDefault();
    showWaitModal();
    $.ajax({
        type: 'post',
        url: '/logout',
        success: data => {
            window.location.href = '/';
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * It will grab name from settings page and post it to server.
 */
function updateName() {
    event.preventDefault();
    showWaitModal();
    const name = $('#inputName').val();
    if (name === '') {
        message('Nickname can not be blank!', false);
        return;
    }
    $.ajax({
        type: 'post',
        url: '/users/settings/name',
        contentType: 'application/json',
        data: JSON.stringify({name: name}),
        success: data => {
            if (data.status < 0) {
                message('Failed.', false);
                return;
            }
            message('Succeeded!', true);
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * It will grab avatar file from settings page and post it to server.
 */
function updateAvatar() {
    event.preventDefault();
    showWaitModal();
    if ($('#avatarFile').prop('files').length < 1) {
        message('Please select file before updating!', false);
        return;
    }
    $.ajax({
        type: 'post',
        url: '/users/settings/avatar',
        contentType: false,
        processData: false,
        data: new FormData($('#avatarForm')[0]),
        success: data => {
            if (data.status < 0) {
                message('Failed.', false);
                return;
            }
            message('Succeeded!', true);
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * It will grab password from settings page and post it to server.
 */
function updatePassword() {
    event.preventDefault();
    showWaitModal();
    const password = $('#password').val();
    const passwordAgain = $('#passwordAgain').val();
    if (password === '' || passwordAgain === '') {
        message('Password can not be blank!', false);
        return;
    }
    if (password !== passwordAgain) {
        message('Repeat password does not match.', false);
        return;
    }
    $.ajax({
        type: 'post',
        url: '/users/settings/password',
        contentType: 'application/json',
        data: JSON.stringify({password: password}),
        success: data => {
            if (data.status < 0) {
                message('Failed.', false);
                return;
            }
            message('Succeeded!', true);
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * Try to search on server and show.
 * If offline, it will call offline search function.
 */
function search() {
    event.preventDefault();
    showWaitModal();
    $('#stories').empty();
    const searchContent = $('#searchBox').val();
    if (searchContent === '') {
        message('Content can not be blank!', false);
        return;
    }
    $.ajax({
        type: 'post',
        url: '/search',
        contentType: 'application/json',
        data: JSON.stringify({query: searchContent}),
        success: stories => {
            if (stories.length < 1) {
                const result = $(document.createElement('p'));
                result.addClass('text-center mt-5').css('font-size', '18px').text('No results.');
                $('#stories').append(result);
            } else
                showStories(stories);
            hideWaitModal();
        }, error: err => {
            console.log(err);
            searchOffline(searchContent);
        }
    });
}

/**
 * Post new story to server.
 * It grabs the text and picture files from new story page.
 * If offline, it will saved story into indexedDB or local storage.
 */
function newStory() {
    event.preventDefault();
    showWaitModal();
    const newStoryContent = $('#new_story').val();
    if (newStoryContent === '') {
        message('Content can not be blank!', false);
        return;
    }
    if ($('#pictures').prop('files').length > 3) {
        message('Can not add more than 3 pictures!', false);
        return;
    }
    $.ajax({
        type: 'post',
        url: '/stories',
        contentType: false,
        processData: false,
        data: new FormData($('#storyForm')[0]),
        success: data => {
            if (data.status < 0) {
                message(data.message, false);
                return;
            }
            socket.emit('new', data.id);
            message('Succeeded!', true, '/stories/' + data.id);
        }, error: err => {
            message('Can not publish story at this moment. Your story has been saved.', false);
            storeSavedStory();
            console.log(err);
        }
    });
}

/**
 * Show stories.
 * @param stories - The stories going to be shown.
 * @param {boolean} isNew - Boolean for if these stories were new stories.
 * @param {boolean} isSaved - Boolean for if these stories were saved stories.
 */
function showStories(stories, isNew = false, isSaved = false) {
    if (stories && stories.length > 0)
        for (let story of stories)
            showStory(story, isNew, isSaved);
}

/**
 * Show single story.
 * @param story - The story going to be shown.
 * @param {boolean} isNew - Boolean for if this story were new stories.
 * @param {boolean} isSaved - Boolean for if this story were saved stories.
 */
function showStory(story, isNew, isSaved) {
    const avatar = $(document.createElement('img'));
    if (isSaved)
        avatar.addClass('mr-2 rounded-circle').attr('src', '/images/avatars/default.png').attr('width', '64').attr('height', '64');
    else
        avatar.addClass('mr-2 rounded-circle').attr('src', '/images/avatars/' + story.user.local.user_id).attr('width', '64').attr('height', '64');

    const avatarLink = $(document.createElement('a'));
    if (isSaved)
        avatarLink.attr('href', '/').append(avatar);
    else
        avatarLink.attr('href', '/users/' + story.user.local.user_id).append(avatar);

    const avatarDiv = $(document.createElement('div'));
    avatarDiv.append(avatarLink);

    const strong = $(document.createElement('strong'));
    if (isSaved)
        strong.text('Sodia @sodia');
    else
        strong.text(story.user.local.name + ' @' + story.user.local.user_id);

    const nameLink = $(document.createElement('a'));
    nameLink.css('color', 'inherit').attr('href', '/').append(strong);

    const nameDiv = $(document.createElement('div'));
    nameDiv.html(nameLink);

    const dateDiv = $(document.createElement('div'));
    if (isSaved)
        dateDiv.css('color', 'grey').text(new Date().toLocaleString('en'));
    else
        dateDiv.css('color', 'grey').text(new Date(story.date).toLocaleString('en'));

    if (isNew) {
        const newBadge = $(document.createElement('p'));
        newBadge.css('margin', '0').css('color', 'red').text('[New]');
        dateDiv.css('display', 'flex').append(newBadge);
    }

    if (isSaved) {
        const savedBadge = $(document.createElement('p'));
        savedBadge.css('margin', '0').css('color', 'orange').text('[Unsync]');
        dateDiv.css('display', 'flex').append(savedBadge);
    }

    const textDiv = $(document.createElement('div'));
    textDiv.addClass('my-1').css('font-size', '18px').css('word-break', 'break-word').text(story.text);

    const picsDiv = $(document.createElement('div'));
    if (isSaved)
        story.pics.forEach(picture => {
            let pic = $(document.createElement('img'));
            pic.css('max-width', '100%').css('margin', '5px').attr('src', picture);
            picsDiv.append(pic);
        });
    else
        story.pictures.forEach(picture => {
            let pic = $(document.createElement('img'));
            pic.css('max-width', '100%').css('margin', '5px').attr('src', '/images/pictures/' + picture);
            picsDiv.append(pic);
        });

    const contentDiv = $(document.createElement('div'));
    contentDiv.append(nameDiv).append(dateDiv).append(textDiv).append(picsDiv);

    const flexDiv = $(document.createElement('div'));
    flexDiv.css('display', 'flex').append(avatarDiv).append(contentDiv);

    const voteButton = $(document.createElement('button'));
    voteButton.addClass('btn btn-outline-primary').attr('onclick', 'voteModal(\'' + story._id + '\')').text('Vote');

    const viewButton = $(document.createElement('a'));
    viewButton.addClass('btn btn-outline-success ml-1').attr('href', '/stories/' + story._id).css('float', 'right').text('View');

    const bottomDiv = $(document.createElement('div'));
    bottomDiv.addClass('mt-3 pt-3').css('border-top', '1px solid #ccc').append(voteButton).append(viewButton);

    const datum = $(document.createElement('div'));
    datum.addClass('mt-5 p-4 rounded shadow-lg').attr('id', story._id).append(flexDiv).append(bottomDiv);

    $('#stories').prepend(datum);
}

/**
 * Delete story by id.
 * @param {string} id - The id of story.
 */
function del(id) {
    showWaitModal();
    $.ajax({
        type: 'delete',
        url: '/stories/' + id,
        success: data => {
            if (data.status < 0) {
                message(data.message, false);
                return;
            }
            message('Succeeded!', true);
            $('#' + id).remove();
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * Show vote modal for specific story.
 * It will load vote record of this story for current user.
 * @param {string} id - The id of story.
 */
function voteModal(id) {
    showWaitModal();
    $.ajax({
        type: 'get',
        url: '/votes?story=' + id,
        success: data => {
            const votes = $(document.createElement('div'));
            votes.addClass('text-center');

            let i = 1;
            for (; i <= data.star; i++) {
                let star = $(document.createElement('i'));
                star.addClass('fas fa-star fa-2x rating-star checked-star').attr('id', 'star-' + i).attr('onmouseover', 'changeStarColor(' + i + ')').attr('onmouseout', 'resetStarColor()').attr('onclick', 'vote(\'' + id + '\', ' + i + ')');
                votes.append(star);
            }
            for (; i < 6; i++) {
                let star = $(document.createElement('i'));
                star.addClass('fas fa-star fa-2x rating-star').attr('id', 'star-' + i).attr('onmouseover', 'changeStarColor(' + i + ')').attr('onmouseout', 'resetStarColor()').attr('onclick', 'vote(\'' + id + '\', ' + i + ')');
                votes.append(star);
            }
            const modal = $('#voteModal');
            modal.find('.modal-body').html(votes);
            hideWaitModal();
            modal.modal('show');
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}

/**
 * Vote story.
 * @param {string} id - The id of story.
 * @param {number} star - The stars of vote.
 */
function vote(id, star) {
    $('#voteModal').modal('hide');
    showWaitModal();
    let vote = {story: id, star: star};
    $.ajax({
        type: 'post',
        url: '/votes',
        contentType: 'application/json',
        data: JSON.stringify(vote),
        success: function (data) {
            if (data.status < 0) {
                message('Failed.', false);
                return;
            }
            message('Succeeded!', true);
        }, error: function (err) {
            message('Can not vote at this moment. Your vote has been saved.', false);
            storeVote(vote);
            console.log(err);
        }
    });
}

/**
 * It will change the color of stars when mouse over stars.
 * @param {number} star_no - The number of stars need to be changed color.
 */
function changeStarColor(star_no) {
    for (let i = 1; i < 6; i++)
        $('#star-' + i).addClass(star_no >= i ? 'temp-checked-star' : 'temp-unchecked-star');
}

/**
 * Reset all stars' color.
 */
function resetStarColor() {
    for (let i = 1; i < 6; i++)
        $('#star-' + i).removeClass('temp-checked-star temp-unchecked-star');
}

/**
 * It will cache all links in the page.
 */
function cachePages() {
    let urls = [];
    for (let i = document.links.length; i-- > 0;)
        if (document.links[i].hostname === window.location.hostname)
            urls.push(document.links[i].href);
    for (let url of urls)
        fetch(url).then(() => console.log('Cache', url));
}

/**
 * It will show the recommended stories.
 */
function recommend() {
    showWaitModal();
    $.ajax({
        type: 'post',
        url: '/stories/recommend',
        success: stories => {
            console.log(stories);
            $('#stories').empty();
            showStories(stories);
            hideWaitModal();
        }, error: err => {
            message(err.responseText || err.statusText, false);
            console.log(err);
        }
    });
}
