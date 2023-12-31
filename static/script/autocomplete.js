// JS FOR THE AUTOCOMPLETE USED IN THE SEARCH BAR

d3.csv('/static/movieNames.csv').then(data => {
    // Add a unique ID to each row
    data.forEach((row, index) => {
        row.id = index
    })

    let miniSearch = new MiniSearch({
        fields: ['Title'], // fields to index for full-text search
        storeFields: ['Title'], // fields to return with search results
        idField: 'id' // field to use as the document identifier
    })
    miniSearch.addAll(data)
    let currentSuggestionIndex = 0

    let input = document.querySelector('input[name="movie"]')

    // Create a ul element to display the suggestions
    let suggestionsList = document.getElementById('ul')

    // Listen for changes to the input element
    input.addEventListener('input', event => {
        // Reset the current suggestion index
        currentSuggestionIndex = 0
        // Get the input value
        let query = event.target.value
        // Search for matching documents
        let results = miniSearch.search(query, {
            prefix: true, // match query terms with a prefix
            fuzzy: 0.5 // allow for some typos or spelling variations
        })
        // Assign a score to each result based on its relevance and popularity
        results.forEach(result => {
            result.score = result.score + (data.length - result.id) / data.length
        })
        // Sort the results by their score
        results.sort((a, b) => b.score - a.score)
        // Map the results to an array of titles
        let suggestions = results.map(result => result.Title)
        // Limit the number of suggestions to 5 or less
        if (suggestions.length > 5) {
            suggestions = suggestions.slice(0, 5)
        }

        // Update the suggestions list with the suggestions
        suggestionsList.innerHTML = ''
        for (let suggestion of suggestions) {
            let li = document.createElement('li')
            li.classList.add('movie-name')
            li.textContent = suggestion
            li.style.padding = '0.5em'
            li.style.cursor = 'pointer'
            li.addEventListener('click', () => {
                input.value = suggestion
                suggestionsList.innerHTML = ''
                const loadingOverlay = document.getElementById('loading');
                loadingOverlay.style.display = 'flex';
                document.querySelector('form.search').submit();
            })
            li.addEventListener('click', () => {
                input.value = suggestion
                suggestionsList.innerHTML = ''
            })
            suggestionsList.appendChild(li)
        }
    })


    // Initialize the current suggestion index to -1
    let currentSuggestionNumber = -1
    // Listen for keydown events on the input element
    input.addEventListener('keydown', event => {
        // Check if the Tab or ArrowDown key was pressed
        if (event.key === 'Tab' || event.key === 'ArrowDown') {
            // Prevent the default behavior of moving focus to the next element
            event.preventDefault()

            // Get the suggestions from the suggestions list
            let lis = Array.from(suggestionsList.querySelectorAll('li'))
            let suggestions = lis.map(li => li.textContent)

            // Check if there are any suggestions
            if (suggestions.length > 0) {
                // Move the selection to the next suggestion
                currentSuggestionNumber = (currentSuggestionNumber + 1) % suggestions.length

                // Update the value of the input element with the value of the currently selected suggestion
                input.value = suggestions[currentSuggestionNumber]

                // Add a class to the currently selected suggestion to highlight it
                lis.forEach((li, index) => {
                    if (index === currentSuggestionNumber) {
                        li.classList.add('selected')
                    } else {
                        li.classList.remove('selected')
                    }
                })
            }
        }
        // Check if the ArrowUp key was pressed
        else if (event.key === 'ArrowUp') {
            // Prevent the default behavior of moving focus to the previous element
            event.preventDefault()

            // Get the suggestions from the suggestions list
            let lis = Array.from(suggestionsList.querySelectorAll('li'))
            let suggestions = lis.map(li => li.textContent)

            // Check if there are any suggestions
            if (suggestions.length > 0) {
                // Move the selection to the previous suggestion
                currentSuggestionNumber = (currentSuggestionNumber - 1 + suggestions.length) % suggestions.length

                // Update the value of the input element with the value of the currently selected suggestion
                input.value = suggestions[currentSuggestionNumber]

                // Add a class to the currently selected suggestion to highlight it
                lis.forEach((li, index) => {
                    if (index === currentSuggestionNumber) {
                        li.classList.add('selected')
                    } else {
                        li.classList.remove('selected')
                    }
                })
            }
        }
    })
})

const loadingOverlay = document.getElementById('loading');

document.querySelector('form.search').addEventListener('submit', function(event) {
    event.preventDefault();
    loadingOverlay.style.display = 'flex';
    document.querySelector('form.search').submit();
    console.log('called')
});
document.querySelector('input[name="movie"]').addEventListener('keypress', function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        loadingOverlay.style.display = 'flex';
        document.querySelector('form.search').submit();
        console.log('called')
    }
});