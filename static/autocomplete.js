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
        // Reset the current suggestion index
        currentSuggestionIndex = 0
        let results = miniSearch.search(query)
        // Filter the results to only include complete matches
        let suggestions = results.filter(result => result.Title.toLowerCase().includes(query.toLowerCase())).map(result => result.Title)
        // Limit the number of suggestions to 5 or less
        if (suggestions.length > 5) {
            suggestions = suggestions.slice(0, 5)
        }
        // Update the suggestions list with the suggestions
        suggestionsList.innerHTML = ''
        for (let suggestion of suggestions) {
            let li = document.createElement('li')
            li.textContent = suggestion
            li.style.padding = '0.5em'
            li.style.cursor = 'pointer'
            li.addEventListener('click', () => {
                input.value = suggestion
                suggestionsList.innerHTML = ''
            })
            suggestionsList.appendChild(li)
        }
    })
    // Listen for keydown events on the input element
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            // Get the suggestions from the suggestions list
            let lis = Array.from(suggestionsList.querySelectorAll('li'))
            let suggestions = lis.map(li => li.textContent)

            // Check if there are any suggestions
            if (suggestions.length > 0) {
                currentSuggestionIndex = lis.findIndex(li => li.classList.contains('selected'))
            // Update the value of the input element with the value of the currently selected suggestion
            input.value = suggestions[currentSuggestionIndex]
            // Clear the suggestions list
            suggestionsList.innerHTML = ''
        }
    }
    // Check if the Tab key was pressed
    if (event.key === 'Tab') {
        // Prevent the default behavior of moving focus to the next element
        event.preventDefault()

        // Get the suggestions from the suggestions list
        let lis = Array.from(suggestionsList.querySelectorAll('li'))
        let suggestions = lis.map(li => li.textContent)

        // Check if there are any suggestions
        if (suggestions.length > 0) {
            // Update the value of the input element with the value of the currently selected suggestion
            input.value = suggestions[currentSuggestionIndex]

            // Add a class to the currently selected suggestion to highlight it
            lis.forEach((li, index) => {
                if (index === currentSuggestionIndex) {
                    li.classList.add('selected')
                } else {
                    li.classList.remove('selected')
                }
            })

            // Move the selection to the next suggestion
            currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length
        }
    }
})
})
