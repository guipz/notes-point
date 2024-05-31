# Introduction

My CS50W's final project is named NotesPoint, a note creation application, but not the usual type. 
It's a geographic based notes creator that permit people to place anonymous notes anywhere in the world.
You can see the application functionalities showcased in this [video](https://www.youtube.com/watch?v=OZfKL8YaVYw).

# Project Description

Did you ever been in a situation where you want to tell someone something but don't know how to do it?
What if you could just leave a note in their house? Now you can! but not physically, that you be too burdensome.
Just simply use NotesPoint, a web based note creation application that permit anyone to leave anonymous notes 
anywhere in the world for anybody to see.

To start using you just need to register and boom, you are good to go. After that, simply head to the map page
and start placing some notes by clicking the bottom map button "Write New Note". Now you can select a point in the map 
by clicking where you want to place the note and a popup will appear where you can enter the note text and the duration
in days, just write whatever you like and click "Post it". That's it, now it's up to everybody to see.

Good, now you can create notes, but it would be even better to read notes created by others too. To do that, navigate
within the map and find a note, then just click on it and you will see a popup with the note text and duration. 

Alright, now let's imagine that after clicking on the note, you see that the note is directed to you. Maybe is 
something offesive, romantic, funny or mysterious, who knows. You can talk with the person that created the note by
clicking the chat icon on the note bottom right. You will be redirected to the chat page to write the first message and
start chating. There you will see a list with chats that initiated by you or others thourgh your notes.

Lastly, after creating so many notes you need to have control of your notes. To do it, go to the "My notes" in the 
navigation bar, there you can see all notes infos like duration and text and a map icon on the bottom right of each one.
This icon takes you to the where is the note in the map, in case you forgot where you placed it.

# Distinctiveness and Complexity

I believe my project meets the distinctiveness and complexity requirement. The distinctiveness of my project comes
from the fact that is uses the geographic of the real world as a way to connect people from with different hobbies,
personalities and interests thourgh their most generic common attribute, the location. This makes the experience 
way more local and near to the person.

Besides being used to talk to people from your neighborhood, you could also use it to create litte puzzles like something
out of a treasure hunting movie. Imagine if someone made multiple notes that each needed the person to go to the location of
it to solve a puzzle and get a hint to the next one. In the last note the person could get a prize or just recognition for
solving the full puzzle.

As of the complexity part, I believe my project satisfy this because is an original idea without anything similar on the internet,
so I didn't had a pretty roadmap to building it and it uses diverse resources and tools to accomplish its purposes that were 
unfamiliar initially to myself. Some of them are listed below:

> **Google Maps API** was used to render the map, render markers and create notes accordingly to the latitude and
> longitude selected by the user. To do this I needed to setup click listeners and control the map with the library API.
> I didn't have any prior experience with Google Maps and this was a great way to get started.

> **Google Maps JavaScript MarkerClusterer** library helped me to manage the notes in the map and maintain perfomance and consequently a good user experience as notes quantity grew. This library provided me a easy way to show and hide notes markers based on the user zoom. It was a pleasant experience to work with this library and extend its functionalities. [Link to the library](https://github.com/googlemaps/js-markerclusterer)

> **Many-to-Many** Django's field was used to create the chats. It made possible to have one person in two different chats
> about the same note. It was kind of a unexplored place to me, as I mainly used to creating One-to-Many Relationships.

> **Bootstrap SCSS** was used to style the website, this includes buttons, modals, navigation bar and almost everything else.
> I was already confident with bootstrap by importing it thourgh the CDN. But I noticed that it wasn't enough and I need to
> extend and modify some of its variables to achieve my objectives. So I downloaded the **SCSS** source code and used a
> transpiler to convert to vanilla CSS. Initially it was out of my comfort zone but really helped me improve my website
> appearance and clean my styling source code.

# Files 

Here is a listing of the files that I created and their purpose:

* notes_point/website
    * /static/website
        * /css/custom
             * styles.scss - scss file where the application styles are located.
        * images
            *   alert_icon.png - icon for alert modal.
            *   chat_icon.png - icon for chat button.
            *   favicon.ico - application favicon
            *   homepage\_background\_map.png - index page background image
            *   map_icon.png - icon for map button.
            *   multiple\_note\_marker.png - used by markerclusterer to represent multiple notes.
            *   notespoint_logo.png - application logo.
            *   return_arrow.png - icon for chat return button.
            *   send_arrow.png - icon for chat send message button.
            *   single\_note\_marker.png - used by map to represent single notes.
        * js 
            *  chat.js - code for chat page.
            *  jquery.js - jquery library.
            *  map.js - code for map.js
            *  sign\_form\_validation.js - code for sign up/in page.
    * /templates/website
        *  /html_snippets
            * navbar\_link.html - html used in template tag for creating navbar links. 
        * base_layout.html - website base layout.
        * chat.html - chat page html.
        * homepage.html - homepage/index page html.
        * map.html - map page html.
        * my_notes.html - my notes page html.
        * navbar_layout.html - base layout with navbar.
        * sign_in.html - sign in page html.
        * sign_up.html - sign up page html.
    * /template_tags
        * website_extras.py - custom templates tags and filters.
    * decorators.py - custom decorators.
    * json_responses.py - templates for api json responses.
    * validators.py - custom model field validators.

# How to Run the Application

To run the application follow the process below:
1. Install requirements.txt
2. Go to notes\_point\website\templates\website\map.html and find the Google Maps script link.
    > <script async
    >   src="https://maps.googleapis.com/maps/api/js?key=VALID_GOOGLE_MAP_KEY&callback=initMap">
    > </script>
3. Replace the **VALID_GOOGLE_MAP_KEY** with a valid Google Cloud API key with Google Maps Javascript enabled.
4. Go back to project root and run in cmd: py manage.py makemigrations
5. Then: py manage.py migrate
6. And finally: py manage.py runserver
7. Now the application should already be running in 127.0.0.1:8080/






