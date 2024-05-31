// Necessary listener to apply bootstrap validation checking.
$(() => {
    $("form").on("submit", event => {
        
        // The form that triggered the event.
        let form = event.target;
        
        // Check form validity. 
        if(!form.checkValidity()) {
            
            // If isn't valid, prevent default form action "submit" and stop propagation.
            event.preventDefault();
            event.stopPropagation();

            // Add bootstrap class to signalize invalid fields in case there's any.
            form.classList.add("was-validated");
        }
    })
})