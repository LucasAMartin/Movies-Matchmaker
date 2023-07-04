// Read the CSV file using D3.js or Papa Parse
d3.csv('/static/movieNames.csv').then(data => {
  // Add a unique ID to each row
  data.forEach((row, index) => {
    row.id = index
  })

  // Create a new instance of MiniSearch
  let miniSearch = new MiniSearch({
    fields: ['Title'], // fields to index for full-text search
    storeFields: ['Title'], // fields to return with search results
    idField: 'id' // field to use as the document identifier
  })

  // Index the data
  miniSearch.addAll(data)

  // Keep track of the current suggestion index
  let currentSuggestionIndex = 0

  // Get the input element
  let input = document.querySelector('input[name="movie"]')

  // Create a ul element to display the suggestions
  let suggestionsList = document.createElement('ul')
  suggestionsList.style.listStyle = 'none'
  suggestionsList.style.margin = 0
  suggestionsList.style.padding = 0
  suggestionsList.style.position = 'absolute'
  input.parentNode.insertBefore(suggestionsList, input.nextSibling)

  // Listen for changes to the input element
  input.addEventListener('input', event => {
    // Reset the current suggestion index
    currentSuggestionIndex = 0

    // Get the input value
    let query = event.target.value

    // Search for matching documents
    let results = miniSearch.search(query)

    // Filter the results to only include complete matches
    let suggestions = results.filter(result => result.Title.toLowerCase().includes(query.toLowerCase())).map(result => result.Title)

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
