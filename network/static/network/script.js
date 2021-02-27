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

document.addEventListener("DOMLoaded", function() {
    
})