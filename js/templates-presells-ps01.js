// JavaScript extracted from templates\presells\ps01.html

// Inline script 3 from ps01.html
// Function to format the date as "Month Day, Year"
function formatDate(date) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}
// Get the current date and subtract 3 days
const currentDate = new Date();
currentDate.setDate(currentDate.getDate() - 3);
// Format the date
const formattedDate = formatDate(currentDate);
// Update the text of the element with the attribute [data-pb-dynamic="updated-at"]
const elements = document.querySelectorAll('[data-pb-dynamic="updated-at"]');
elements.forEach(element => {
  element.textContent = formattedDate;
});