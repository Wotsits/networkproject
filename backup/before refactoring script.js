//THIS IS A BACKUP OF JS FILE PRIOR TO REFACTORING

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

///////////////////////////////////////////////////////////////////

////////////////////////////////////// LIKECOUNT FUNCTIONALITY

function likecount(postid) {
    const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value

    const request = new Request(
        `/likecount?id=${postid}`, {
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
        document.querySelector(`#likecountpost-${postid}`).textContent = `${likecounter}`
        
    })
    
}

///////////////////////////////////////////////////////////////////

/////////////////////////////////////// TOGGLE FOLLOW FUNCTIONALITY

function togglefollow() {
    console.log(document.querySelector("#followbutton").getAttribute("data-followee"))
    fetch('/following', {
        method: "POST",
        body: JSON.stringify({ 
            followee: document.querySelector("#followbutton").getAttribute("data-followee"),
        })
    })
    .then(response => response.json)
    .then(data => {
        followbutton = document.querySelector("#followbutton")
        if (followbutton.innerHTML === "Follow") {
            followbutton.innerHTML = "Following"
        } else {
            followbutton.innerHTML = "Follow"
        }
    })
}

////////////////////////////////////////////////////////////////////

////// FETCH POST SUNCTIONALITY FOR INITIAL LOAD AND INFINITE SCROLL

function fetchpage(apiendpoint) {
    
    // set the container div
    let holderdiv = document.querySelector('#posts')

    fetch(apiendpoint)
    .then(response => response.json())
    .then(page => {

        nextpage = page.next

        for (i = 0; i < page.results.length; i++) {
            
            //creates post div
            const postdiv = document.createElement('div')
            postdiv.className = 'individual'
            postdiv.setAttribute("id", `post-${page.results[i].id}`)
            const postheader = document.createElement('div')
            postheader.className = 'postheader'
            const postcontent = document.createElement('div')
            postcontent.className = 'postcontent'
            const controlpanel = document.createElement('div')
            controlpanel.setAttribute("id", `post${page.results[i].id}-control`)
            controlpanel.className = 'controlpanel'

            //determine post type
            let posttype = ''
            if (page.results[i].imageurl) {
                posttype = 'image'
            } else if (page.results[i].videourl) {
                posttype = 'video'
            } else {
                posttype = 'text'
            }
            
            //determines whether a profile picture is included and set up post header accordingly.
            if (page.results[i].user.profilepictureurl) {
                postheader.innerHTML = `<img class='profilepic' src="${page.results[i].user.profilepictureurl}"></img><a href="profile/${page.results[i].user.username}"><h4>${page.results[i].user.first_name} ${page.results[i].user.last_name}</h4></a>`
            } else {
                postheader.innerHTML = `<a href="${page.results[i].user.username}"><h4>${page.results[i].user.first_name} ${page.results[i].user.last_name}</h4></a>`
            }

            //sets the postcontent div dependant on post type.  
            if (posttype === 'image') {
                postcontent.innerHTML = `<div class='postimage' style='background: url("${page.results[i].imageurl}") no-repeat center center'></div><p>${page.results[i].content }</p>`
            } else if (posttype === 'video') {
                postcontent.innerHTML = `<div class='postvideo'><iframe width = 100% src='${page.results[i].videourl}'></iframe></div><p>${page.results[i].content}</p>`
            } else {
                postcontent.innerHTML = `<p>${page.results[i].content }</p>`
            }

            //sets the controldiv content dependant on who is viewing post
            if (user === page.results[i].user.username) {
                controlpanel.innerHTML = `<div id="likecountpost-${page.results[i].id}"></div><p>like(s)</p><button id="post${page.results[i].id}-edit" data-action="edit" onclick=launcheditor(this) data-postid=${page.results[i].id} data-postimage="${page.results[i].imageurl}" data-postvideo="${page.results[i].videourl}" data-postcontent="${page.results[i].content}">Edit</button>`
            }
            else {
                controlpanel.innerHTML = `<button id="like-${page.results[i].id}" onclick=togglelikeadd(${page.results[i].id})>Like</button><div id="likecountpost-${page.results[i].id}"></div><button>Comment</button>`
                likecount(page.results[i].id)
            }

            // compiles the div.
            postdiv.append(postheader)
            postdiv.append(postcontent)
            postdiv.append(controlpanel)
            holderdiv.append(postdiv)
        }

        // adds 'nothing more to load' at the end when nextpage === null
        if (nextpage === null) {
            endofcontentdiv = document.createElement("div")
            endofcontentdiv.innerHTML = "Sad times!  Nothing more to see :-("
            holderdiv.append(endofcontentdiv)
        }
    })
}

///////////////////// LAUCH & POPULATE POST EDITOR

function launcheditor(button) {

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
        submitbuttontext = "Submit-New-Post"
    }

    // pre-populate the edit slider.
    slider = document.querySelector('#postnewedit')
    slider.innerHTML = `
        <h3>${slidertitle}</h3>
        <form>
            <input id="formpostid" type="hidden" name="postid" value="${postid}">
            <input id="formpostimage" type="text" name="postimage" placeholder="URL of post image" value="${postimage}">
            <input id="formpostvideo" type="text" name="postvideo" placeholder="URL of post video" value="${postvideo}">
            <textarea id="formpostcontent" name="postcontent" placeholder="Post content">${postcontent}</textarea>
            <input type="submit" onclick=${onclickaction} value=${submitbuttontext}>
        </form>`
    
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
    const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value

    if (action === "edit") {
    
        // PUT request to the server
        // grabs the csrf_token from the page. 
        postid = document.querySelector('#formpostid').value
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
            //sets the postcontent div dependant on post type.  
            if (posttype === 'image') {
                post.innerHTML = `<div class='postimage' style='background: url("${postimage}") no-repeat center center'></div><p>${postcontent}</p>`
            } else if (posttype === 'video') {
                post.innerHTML = `<div class='postvideo'><iframe width = 100% src='${postvideo}'></iframe></div><p>${postcontent}</p>`
            } else {
                post.innerHTML = `<p>${postcontent}</p>`
            }
            postcontrol = document.querySelector(`#post${postid}-control`)
            postcontrol.innerHTML = ''
            postcontrol.innerHTML = `<button id="post${postid}-edit" onclick=launcheditor(this) data-postid=${postid} data-postimage="${postimage}" data-postvideo="${postvideo}" data-postcontent="${postcontent}">Edit</button>`
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
            //create the div for the new post
            const postdiv = document.createElement('div')
            postdiv.className = 'individual'
            postdiv.setAttribute("id", `post-${response.id}`)
            const postheader = document.createElement('div')
            postheader.className = 'postheader'
            const postcontent = document.createElement('div')
            postcontent.className = 'postcontent'
            const controlpanel = document.createElement('div')
            controlpanel.setAttribute("id", `post${response.id}-control`)
            controlpanel.className = 'controlpanel'

            //determine post type
            let posttype = ''
            if (response.imageurl) {
                posttype = 'image'
            } else if (response.videourl) {
                posttype = 'video'
            } else {
                posttype = 'text'
            }
            
            //determines whether a profile picture is included and set up post header accordingly.
            if (response.user.profilepictureurl) {
                postheader.innerHTML = `<img class='profilepic' src="${response.user.profilepictureurl}"></img><a href="profile/${response.user.username}"><h4>${response.user.first_name} ${response.user.last_name}</h4></a>`
            } else {
                postheader.innerHTML = `<a href="${response.user.username}"><h4>${response.user.first_name} ${response.user.last_name}</h4></a>`
            }

            //sets the postcontent div dependant on post type.  
            if (posttype === 'image') {
                postcontent.innerHTML = `<div class='postimage' style='background: url("${response.imageurl}") no-repeat center center'></div><p>${response.content }</p>`
            } else if (posttype === 'video') {
                postcontent.innerHTML = `<div class='postvideo'><iframe width = 100% src='${response.videourl}'></iframe></div><p>${response.content}</p>`
            } else {
                postcontent.innerHTML = `<p>${response.content }</p>`
            }

            //sets the controldiv content dependant on who is viewing post
            if (user === response.user.username) {
                controlpanel.innerHTML = `<div id="likecountpost-${response.id}"></div><p>like(s)</p><button id="post${response.id}-edit" data-action="edit" onclick=launcheditor(this) data-postid=${response.id} data-postimage="${response.imageurl}" data-postvideo="${response.videourl}" data-postcontent="${response.content}">Edit</button>`
            }
            else {
                controlpanel.innerHTML = `<button id="like-${response.id}" onclick=togglelikeadd(${response.id})>Like</button><div id="likecountpost-${response.id}"></div><button>Comment</button>`
                likecount(response.id)
            }

            // compiles the div.
            postdiv.append(postheader)
            postdiv.append(postcontent)
            postdiv.append(controlpanel)
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
        apiendpoint = `/serveposts?source=profile`
    }
    // calls fetchpage passing in the end point. 
    fetchpage(apiendpoint)

})

////////////////////////// TOGGLE LIKE

function togglelikeadd(postid) {
    const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value
    
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
    })
}

function togglelikedel(postid) {
    const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value
    
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
            return response.json()
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
    })
}




/////////////// INFINITE SCROLL FUNCTIONALITY

window.onscroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        if (nextpage === null) {
        }
        else {
            fetchpage(nextpage)
        }
    }
}

/////////////////////////////////////////////