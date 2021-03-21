/*

Explanation of functionality:

When the index, following or profile page loads they are identified by the script at the foot of this file.  

This governs the endpoint to which the fetch requests are made.  A fetch request is made and the results 

are returned by the server in paginated form.  Part of the returned payload is the 'nextpage' GET url.

If the next page fetch URL is not NULL, it is updated into the 'nextpage variable declared at the head 

of this file and is subsequently used for the fetch requests performed by the infinite scroll.  



Availability of edit functionality is restricted to situations where the username in the HTML matches the 

username of the post.  This is then re-enforced by server-side validation.

*/

let nextpage = null
let user = document.querySelector('#username').textContent
const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value
// timer to stop infinite scroll firing multiple times
let infinitescrolltimer = Date.now()

///////////////////////////////////////////////////////////////////

////////////////////////////////////// LIKECOUNT & STATUS FUNCTIONALITY

function likecount(postid) {
    const request = new Request(
        `/likecountandstatus?id=${postid}`, {
            headers: {
                'X-CSRFToken': csrf_token,
                'Content-Type': 'application/JSON'
            }
        }
    );

    fetch(request, {
        method: 'GET'
    })

    .then(response => {
        // presents alert if POST request returns anything other than 201 status code and breaks out.  
        if (!response.status === 400) {
            alert("Sorry, your request to the server was not successful.  If the problem persists, please email admin@admin.com")
            return 0
        } else {
            return response.json()
        } 
    })
    .then(response => {
        let likecounter = response.likecount
        likecounter = likecounter.toString()
        let likestatus = response.likestatus
        likebutton = document.querySelector(`#like-${postid}`)
        //if the already user likes the post being loaded
        if (likestatus) {
            likebutton.setAttribute("onclick", `togglelikedel(${postid})`)
            likebutton.textContent = "Unlike"
            likeheart = document.querySelector(`#likeheart-${postid}`)
            likeheart.classList.add("likeheartliked")
        }
        document.querySelector(`#likecountpost-${postid}`).textContent = `${likecounter}`
        
    })
    
}

///////////////////////////////////////////////////////////////////

///////////////////////////// COMMENT CREATION FUNCTION 

/*

used by subsequent functions to create comment display divs

*/

function createcommentdiv(commentdata) {
    let comment = document.createElement('div')
    comment.setAttribute('id', `${commentdata.id}`)
    comment.className = 'comment'
    comment.innerHTML = `<h6>${commentdata.user.first_name} ${commentdata.user.last_name} said:</h6>
                        <p>${commentdata.content}</p>`
    return comment
}

//////////////////////////// COMMENT FETCH FUNCTION

/*

used by subsequent functions to fetch and load comments

*/

function commentfetch(url, postid) {

    const request = new Request(
        url, {
            headers: {
                'X-CSRFToken': csrf_token,
                'Content-Type': 'application/JSON'
            }
        }
    );

    fetch(request, {
        method: 'GET'
    })

    .then(response => {
        // presents alert if GET request returns anything other than 400 status code and breaks out.  
        if (!response.status === 400) {
            alert("Sorry, your request to the server was not successful.  If the problem persists, please email admin@admin.com")
            return 0
        } else {
            return response.json()
        } 
    })
    
    .then(response => {
        const commentsholder = document.querySelector(`#comments-post-${postid}`)
        nextcommentspage = response.next
        const commentsdata = response.results
        
        for (i = 0; i < commentsdata.length; i++) {
            comment = createcommentdiv(commentsdata[i])
            commentsholder.append(comment)
        }

        nextpageloader = document.querySelector(`#nextpageloader-post-${postid}`)
        if (nextpageloader) {
            nextpageloader.remove()
        }

        if (nextcommentspage) {
            nextpageloader = document.createElement('div')
            nextpageloader.setAttribute("id", `nextpageloader-post-${postid}`)
            nextpageloader.innerHTML = `<button onclick=loadmorecomments(this) data-next="${nextcommentspage}" data-postid="${postid}">Click here to load more comments</button>`
            commentsholder.append(nextpageloader)
        }
    })
}

///////////////////////////////////////////////////



//////////////////////////// LOAD FIRST PAGE OF COMMENTS

function getinitialcomments(postid) {

    let url = `/servecomments?postid=${postid}`

    //call to commentfetch to pull through comments and create comment components. 
    commentfetch(url, postid)

}

///////////////////////////////////////////////////////////////////

/////////////////////////////////////// LOAD MORE COMMENTS

function loadmorecomments(event) {

    //extract data from button element
    let url = event.getAttribute("data-next")
    let postid = event.getAttribute("data-postid")
    
    //call to commentfetch to pull through comments and create comment components. 
    commentfetch(url, postid)

}

//////////////////////////////////////////////////////////

/////////////////////////////////////// TOGGLE FOLLOW FUNCTIONALITY

function togglefollow() {
    fetch('/following', {
        method: "POST",
        body: JSON.stringify({ 
            followee: document.querySelector("#followbutton").getAttribute("data-followee"),
        })
    })
    .then(response => response.json())
    .then(data => {
        followbutton = document.querySelector("#followbutton")
        followcount = document.querySelector(".countnumber")
        count = parseInt(followcount.textContent)
        
        if (followbutton.innerHTML === "Follow") {
            count++
            followcount.textContent = count.toString()
            followbutton.innerHTML = "Following"
        } else {
            count--
            followcount.textContent = count.toString()
            followbutton.innerHTML = "Follow"
        }
    })
}

////////////////////////////////////////////////////////////

/////////////////////////////////////// LAUNCH COMMENTER

function launchcommenter(event) {
    postid = event.getAttribute("data-post")
    // checks if the commenter is already in place and removes it if so.
    if (document.querySelector(`#commenter-${postid}`)) {
        document.querySelector(`#commenter-${postid}`).remove()
    }

    //else, creates the commenter and sets it up to take input.
    else {
        commenter = document.createElement('div')
        commenter.className = "commenter"
        commenter.setAttribute("id", `commenter-${postid}`)
        commenter.innerHTML =   `<form>
                                    <input type="hidden" id="submitcommentpostid" value=${postid}>
                                    <textarea id="submitcommentcontent" placeholder="Your Comment"></textarea>
                                    <button onclick=submitcomment(this) value="Submit">Submit</button
                                </form>`
        container = document.querySelector(`#post-${postid}`)
        container.insertBefore(commenter, container.lastChild)
    }
}

function submitcomment(event) {
    postid = document.querySelector("#submitcommentpostid").value
    comment = document.querySelector("#submitcommentcontent").value

    event.parentElement.parentElement.remove()

    const request = new Request(
        '/newcomment', {
            headers: {
                'X-CSRFToken': csrf_token,
                'Content-Type': 'application/JSON'
            }
        }
    );

    fetch(request, {
        method: "POST",
        body: JSON.stringify({ 
            postid: postid,
            content: comment
        })
    })
    .then(response => response.json())
    .then(data => {
        comment = createcommentdiv(data)
        parentdiv = document.querySelector(`#comments-post-${postid}`)
        parentdiv.insertBefore(comment, parentdiv.firstChild)

    })
}

///////////////////////////////////// CREATE POST COMPONENT CALLED ELSEWHERE

function createpostdiv(postdata) {
    //creates post div
    const postdiv = document.createElement('div')
    postdiv.className = 'individual'
    postdiv.setAttribute("id", `post-${postdata.id}`)
    const postheader = document.createElement('div')
    postheader.className = 'postheader'
    const postcontent = document.createElement('div')
    postcontent.className = 'postcontent'
    const likecommentcount = document.createElement('div')
    likecommentcount.className = 'likecommentcount'
    const controlpanel = document.createElement('div')
    controlpanel.setAttribute("id", `post${postdata.id}-control`)
    controlpanel.className = 'controlpanel'
    const comments = document.createElement('div')
    comments.setAttribute("id", `comments-post-${postdata.id}`)
    comments.className = 'commentslist'


    //determine post type
    let posttype = ''
    if (postdata.imageurl) {
        posttype = 'image'
    } else if (postdata.videourl) {
        posttype = 'video'
    } else {
        posttype = 'text'
    }

    //determines whether a profile picture is included and set up post header accordingly.
    let postdateraw = new Date(postdata.datetime)
       
    if (postdata.user.profilepictureurl) {
        postheader.innerHTML = `<img class='profilepic' src="${postdata.user.profilepictureurl}"></img><div><a href="profile/${postdata.user.username}"><h4>${postdata.user.first_name} ${postdata.user.last_name}</h4></a><p class="postdate">${postdateraw.toString()}</p></div>`
    } else {
        postheader.innerHTML = `<a href="${postdata.user.username}"><h4>${postdata.user.first_name} ${postdata.user.last_name}</h4></a>`
    }

    //sets the postcontent div dependant on post type.  
    if (posttype === 'image') {
        postcontent.innerHTML = `<div class='postimage' style='background: url("${postdata.imageurl}") no-repeat center center'></div><p>${postdata.content }</p>`
    } else if (posttype === 'video') {
        postcontent.innerHTML = `<div class='postvideo'><iframe width = 100% src='${postdata.videourl}'></iframe></div><p>${postdata.content}</p>`
    } else {
        postcontent.innerHTML = `<p>${postdata.content }</p>`
    }

    //sets the likecommentcount element
    likecommentcount.innerHTML = `<div id="likecountpost-${postdata.id}"></div>
                                <svg id="likeheart-${postdata.id}" version="1.1" height=24px xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                viewBox="0 0 391.837 391.837" style="enable-background:new 0 0 391.837 391.837;" xml:space="preserve">
                                    <g>
                                        <path d="M285.257,35.528c58.743,0.286,106.294,47.836,106.58,106.58
                                            c0,107.624-195.918,214.204-195.918,214.204S0,248.165,0,142.108c0-58.862,47.717-106.58,106.58-106.58l0,0
                                            c36.032-0.281,69.718,17.842,89.339,48.065C215.674,53.517,249.273,35.441,285.257,35.528z"/>
                                    </g>        
                                </svg>`

    //sets the controldiv content dependant on who is viewing post
    if (user === postdata.user.username) {
        controlpanel.innerHTML = `<div><i class="far fa-edit"></i><button id="post${postdata.id}-edit" data-action="edit" onclick=launcheditor(this) data-postid=${postdata.id} data-postimage="${postdata.imageurl}" data-postvideo="${postdata.videourl}" data-postcontent="${postdata.content}">Edit</button></div><div><i class="far fa-comment"></i><button data-post="${postdata.id}" onclick=launchcommenter(this)>Comment</button></div>`
    }
    else {
        controlpanel.innerHTML = `<div><i class="far fa-thumbs-up"></i><button id="like-${postdata.id}" onclick=togglelikeadd(${postdata.id})>Like</button></div><div><i class="far fa-comment"></i><button data-post="${postdata.id}" onclick=launchcommenter(this)>Comment</button></div>`
    }
    likecount(postdata.id)

    // setup the comments div
    getinitialcomments(postdata.id)

    // compiles the div.
    postdiv.append(postheader)
    postdiv.append(postcontent)
    postdiv.append(likecommentcount)
    postdiv.append(controlpanel)
    postdiv.append(comments)
    
    //returns the postdiv to the calling function
    return postdiv   
}

////// FETCH POST FUNCTIONALITY FOR INITIAL LOAD AND INFINITE SCROLL

function fetchpage(apiendpoint) {
    
    // set the container div
    let holderdiv = document.querySelector('#posts')

    fetch(apiendpoint)
    .then(response => response.json())
    .then(page => {

        nextpage = page.next

        for (i = 0; i < page.results.length; i++) {
            
            //creates a div component for each post in results.
            let postdiv = createpostdiv(page.results[i])
            holderdiv.append(postdiv)

        }
        // adds 'nothing more to load' at the end when nextpage === null
        if (nextpage === null) {
            endofcontentdiv = document.createElement("div")
            endofcontentdiv.innerHTML = "<p class='nothingmore'>--- Sad times!  Nothing more to see <i class='far fa-sad-tear'></i> ---</p>"
            holderdiv.append(endofcontentdiv)
        }
    })
}

///////////////////// LAUNCH & POPULATE POST EDITOR

function launcheditor(button) {

    if (button.getAttribute("data-action")) {
        if (button.getAttribute("data-action") === "new") {
            slidertitle = "Create New Post"
            onclickaction = "submitandcloseeditor('newpost')"
        } else {
            slidertitle = "Edit Your Post"
            onclickaction = "submitandcloseeditor('edit')"
        }
    
        // get the post info from the edit button
        
        let postid = button.getAttribute('data-postid')
        let postimage = button.getAttribute('data-postimage')
        let postvideo = button.getAttribute('data-postvideo')
        let postcontent = button.getAttribute('data-postcontent')
        let submitbuttontext = "Edit"
        
        if (postid === null) {
            postid = ""
            postimage = ""
            postvideo = ""
            postcontent = ""
            submitbuttontext = "Submit"
        }
    
        // pre-populate the edit slider.
        slider = document.querySelector('#postnewedit')
        slider.innerHTML = `
            <i onclick=launcheditor(this) class="fas fa-times"></i>
            <h3>${slidertitle}</h3>
            <form>
                <input id="formpostid" type="hidden" name="postid" value="${postid}">
                <input id="formpostimage" type="text" name="postimage" placeholder="URL of post image" value="${postimage}">
                <input id="formpostvideo" type="text" name="postvideo" placeholder="URL of post video" value="${postvideo}">
                <textarea id="formpostcontent" name="postcontent" placeholder="Post content">${postcontent}</textarea>
                <input type="submit" onclick=${onclickaction} value=${submitbuttontext}>
            </form>`
    }
    
    // open the edit slider (or close it if it is already open)
    if (slider.classList.contains('animateout')) {
        slider.classList.remove('animateout')
        slider.classList.add('animatein')
    } else if (slider.classList.contains('animatein')) {
        slider.classList.remove('animatein')
        slider.classList.add('animateout')
    } else {
        slider.classList.add('animatein')
    }
}   

//////////////// SLIDER CONTENT SUBMISSION

function submitandcloseeditor(action) {
    slider = document.querySelector('#postnewedit')
    // grab the edited info from the form
    postimage = document.querySelector('#formpostimage').value
    postvideo = document.querySelector('#formpostvideo').value
    postcontent = document.querySelector('#formpostcontent').value
    postid = document.querySelector('#formpostid').value

    if (action === "edit") {
    
        // PUT request to the server to edit a post
        // grabs the csrf_token from the page. 
        
        const request = new Request(
            `/post/${postid}`, {
                headers: {
                    'X-CSRFToken': csrf_token,
                    'Content-Type': 'application/JSON'
                }
            }
        );
        fetch(request, {
            method: 'PUT',
            body: JSON.stringify({
                imageurl: postimage,
                videourl: postvideo,
                content: postcontent
            })
        })
        .then(response => {
            if (response.status === 200) {
                response.json()
            // presents alert if PUT request returns anything other than 200 status code and breaks out.    
            } else {
                alert("Sorry, your edit was not successful.  If the problem persists, please email admin@admin.com")
                return 0
            }
        })
        .then(response => {
            // update the updated in the client-side HTML
            post = document.querySelector(`#post-${postid} .postcontent`)
            let posttype = ''
                if (postimage) {
                    posttype = 'image'
                } else if (postvideo) {
                    posttype = 'video'
                } else {
                    posttype = 'text'
                }
            // sets the postcontent div dependant on post type.  
            if (posttype === 'image') {
                post.innerHTML = `<div class='postimage' style='background: url("${postimage}") no-repeat center center'></div><p>${postcontent}</p>`
            } else if (posttype === 'video') {
                post.innerHTML = `<div class='postvideo'><iframe width = 100% src='${postvideo}'></iframe></div><p>${postcontent}</p>`
            } else {
                post.innerHTML = `<p>${postcontent}</p>`
            }

            // sets the post edit button data
            posteditbutton = document.querySelector(`#post${postid}-edit`)
            posteditbutton.setAttribute("data-postimage", postimage)  
            posteditbutton.setAttribute("data-postvideo", postvideo)
            posteditbutton.setAttribute("data-postcontent", postcontent)

        })   
    }

    // POST REQUEST TO THE SERVER FOR NEW POST
    else {
        const request = new Request(
            `/newpost`, {
                headers: {
                    'X-CSRFToken': csrf_token,
                    'Content-Type': 'application/JSON'
                }
            }
        );
        fetch(request, {
            method: 'POST',
            body: JSON.stringify({
                "imageurl": postimage,
                "videourl": postvideo,
                "content": postcontent
            })
        })

        .then(response => {
            // presents alert if POST request returns anything other than 201 status code and breaks out.  
            if (!response.status === 201) {
                alert("Sorry, your post was not successful.  If the problem persists, please email admin@admin.com")
                return 0
            } else {
                return response.json()
            } 
        })

        .then(response => {

            //creates a div component for the post
            let postdiv = createpostdiv(response)
            
            //inserts that compnent into the stream at the top. 
            holderdiv = document.querySelector('#posts')
            holderdiv.insertBefore(postdiv, holderdiv.firstChild)
        })   
    }
    
    // clear and close the edit panel.
    slider.innerHTML = ""
    slider.classList.remove('animatein')
    slider.classList.add('animateout')
}

/////////////// FETCH POSTS ACTIVATION

document.addEventListener("DOMContentLoaded", function() {
    let apiendpoint = ''
    
    // sets the relevant GET endpoint depending on the route currently active
    if (window.location.pathname === "/") {
        apiendpoint = `/serveposts?source=index`
    }   
    else if (window.location.pathname =="/following") {
        apiendpoint = `/serveposts?source=follow`
    }
    else {
        // extract username from url in profile view
        let username = window.location.pathname.split('/')
        username = username[2]
        console.log(username)
        apiendpoint = `/serveposts?username=${username}&&source=profile`
    }
    
    // calls fetchpage passing in the end point. 
    fetchpage(apiendpoint)

})

////////////////////////// TOGGLE LIKE

function togglelikeadd(postid) {

    const request = new Request(
        `/newlike`, {
            headers: {
                'X-CSRFToken': csrf_token,
                'Content-Type': 'application/JSON'
            }
        }
    );

    fetch(request, {
        method: 'POST',
        body: JSON.stringify({
            "id": postid,
        })
    })

    .then(response => {
        // presents alert if POST request returns anything other than 201 status code and breaks out.  
        if (!response.status === 201) {
            alert("Sorry, your like was not successfully registered.  If the problem persists, please email admin@admin.com")
            return 0
        } else {
            return response.json()
        } 
    })
    .then(response => {
        let likebutton = document.querySelector(`#like-${postid}`)
        likebutton.textContent = "Unlike"
        likebutton.setAttribute("onclick", `togglelikedel(${postid})`)
        let likecounter = document.querySelector(`#likecountpost-${postid}`)
        let likecount = likecounter.textContent
        likecount = parseInt(likecount, 10)
        likecount = likecount + 1
        likecount = likecount.toString()
        likecounter.textContent = likecount
        likeheart = document.querySelector(`#likeheart-${postid}`)
        if (likeheart.classList.contains("likeheartdeactivated")){
            likeheart.classList.remove("likeheartdeactivated")
        }
        likeheart.classList.add("likeheartactivated")
    })
}

function togglelikedel(postid) {
    
    const request = new Request(
        `/dellike`, {
            headers: {
                'X-CSRFToken': csrf_token,
                'Content-Type': 'application/JSON'
            }
        }
    );

    fetch(request, {
        method: 'POST',
        body: JSON.stringify({
            "id": postid,
        })
    })

    .then(response => {
        // presents alert if POST request returns anything other than 201 status code and breaks out.  
        if (!response.status === 201) {
            alert("Sorry, we were unable to remove your like.  If the problem persists, please email admin@admin.com")
            return 0
        } else {
            response.json()
        } 
    })

    .then(response => {
        let likebutton = document.querySelector(`#like-${postid}`)
        likebutton.textContent = "Like"
        likebutton.setAttribute("onclick", `togglelikeadd(${postid})`)
        let likecounter = document.querySelector(`#likecountpost-${postid}`)
        let likecount = likecounter.textContent
        likecount = parseInt(likecount, 10)
        likecount = likecount - 1
        likecount = likecount.toString()
        likecounter.textContent = likecount
        likeheart = document.querySelector(`#likeheart-${postid}`)
        if (likeheart.classList.contains("likeheartactivated")) {
            likeheart.classList.remove("likeheartactivated")
        } else if (likeheart.classList.contains("likeheartliked")) {
            likeheart.classList.remove("likeheartliked")
        }
        likeheart.classList.add("likeheartdeactivated")
    })
}




/////////////// INFINITE SCROLL FUNCTIONALITY

window.onscroll = () => {
    if (infinitescrolltimer < Date.now() - 100) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            if (nextpage === null) {
            }
            else {
                fetchpage(nextpage)
                infinitescrolltimer = Date.now()
            }
        }
    }   

}

/////////////////////////////////////////////

////////////// SLEEP FUNCTION
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }