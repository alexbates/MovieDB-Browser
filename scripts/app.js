
var currentLayoutType = 'grid';
$(function(){
    displayTopMovies(1);

    // Handle search button click
    $('.search-btn-m').on('click', function(event) {
        event.preventDefault();
        performMovieSearch(1);
    });
    $('.search-btn-t').on('click', function(event) {
        event.preventDefault();
        performTVSearch(1);
    });

    // Handle Enter key press in the search input
    $('#search-input-m').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performMovieSearch(1)
            // Remove focus from search input
            $(this).blur();
        }
    });
    $('#search-input-t').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performTVSearch(1)
            // Remove focus from search input
            $(this).blur();
        }
    });
});

function applyLayout(layoutType) {
    // These two lines are needed to ensure active class is present when switching tabs
    $(".layoutbtn").removeClass("active");
    $(".layoutbtn[data-layout='" + layoutType + "']").addClass("active");
    if (layoutType === 'list') {
        $('#videocontainer').removeClass('grid-layout').addClass('list-layout');
        $('#videocontainer2').removeClass('grid-layout').addClass('list-layout');
        $('#videocontainer3').removeClass('grid-layout').addClass('list-layout');
        $('#videocontainer4').removeClass('grid-layout').addClass('list-layout');
    } else if (layoutType === 'grid') {
        $('#videocontainer').removeClass('list-layout').addClass('grid-layout');
        $('#videocontainer2').removeClass('list-layout').addClass('grid-layout');
        $('#videocontainer3').removeClass('list-layout').addClass('grid-layout');
        $('#videocontainer4').removeClass('list-layout').addClass('grid-layout');
    }
}

// Handle the switching between grid and list layouts
$(document).on('click', '.layoutbtn', function() {
    $(".layoutbtn").removeClass("active");
    $(this).addClass("active");
    // Get value of data-layout
    currentLayoutType = $(this).data('layout');
    applyLayout(currentLayoutType);
});

// Hide modal overlay when close button is clicked
// modified because #btnHide is not present on page load
$(document).on('click', '#btnHide', function() {
    $("#videodetail").fadeOut();
});

function castDetails(castid) {
    var service_point = "https://api.themoviedb.org/3/person/" + castid;
    
    $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson) {
        // videodetail div is hidden by default. Show it when a video is clicked
        $("#videodetail").show();
        // Data that is passed to template
        var data = {};

        data.c_name = detailjson.name ? detailjson.name : "Unknown Person";
        data.c_biography = detailjson.biography ? detailjson.biography : "Not found.";
        data.c_birthday = detailjson.birthday ? detailjson.birthday : "Unknown";
        data.c_birthplace = detailjson.place_of_birth ? detailjson.place_of_birth : "Unknown";
        data.c_imdb = detailjson.imdb_id ? "https://www.imdb.com/name/" + detailjson.imdb_id : "#";

        if (detailjson.gender === 1) {
            data.c_gender = "Female";
        } else if (detailjson.gender === 2) {
            data.c_gender = "Male";
        } else {
            data.c_gender = "Unknown";
        }

        // Handle templating
        var template = $("#castDetails").html();
        var resultHTML = Mustache.render(template, data);
        $('#cast-details').html(resultHTML);
    });
}
function displayMovieDetails(videoid) {
    var service_point = "https://api.themoviedb.org/3/movie/" + videoid;
    
    $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson) {
        // videodetail div is hidden by default. Show it when a video is clicked
        $("#videodetail").show();
        // Data that is passed to template
        var data = {};

        data.backdrop_path = "https://image.tmdb.org/t/p/w1280/" + detailjson.backdrop_path;
        data.poster_path = detailjson.poster_path ? "https://image.tmdb.org/t/p/w500/" + detailjson.poster_path : "/images/video-not-found.png";
        data.title = detailjson.title ? detailjson.title : "Unknown Title";
        data.release_date = detailjson.release_date ? detailjson.release_date : "Unknown";
        data.number_of_episodes = detailjson.number_of_episodes ? detailjson.number_of_episodes : "Unknown";
        data.overview = detailjson.overview ? detailjson.overview : "No overview is available.";
        data.runtime = detailjson.runtime ? detailjson.runtime : "Uknown";
        data.vote_average = detailjson.vote_average ? detailjson.vote_average : "Unknown";

        // Create multiple spans for each genre
        data.genres = detailjson.genres.map(genre => `<span class="genre">${genre.name}</span>`).join(' ');

        // Create multiple spans for each genre
        data.prod_companies = detailjson.production_companies
            // Filter out companies with null logo_path
            .filter(company => company.logo_path !== null)
            .map(company => `<img class="prod-company" src="https://image.tmdb.org/t/p/w500${company.logo_path}" alt="">`)
            .join(' ');

        // Create multiple spans for each language
        data.spoken_languages = detailjson.spoken_languages
            // Filter out companies with null logo_path
            .filter(name => name.english_name !== null)
            .map(name => `${name.english_name}`)
            .join(', ');

        data.reviews = []
        var service_point2 = "https://api.themoviedb.org/3/movie/" + videoid + "/reviews";
        var reviewsAjax = $.ajax(service_point2, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson2) {
            for (i in detailjson2.results) {
                var username = detailjson2.results[i].author_details.username ? detailjson2.results[i].author_details.username : "Unknown";
                var created_at = detailjson2.results[i].created_at ? detailjson2.results[i].created_at : "Creation Date Unknown";
                var content = detailjson2.results[i].content ? detailjson2.results[i].content : "No review is available.";
                data.reviews.push({
                    username: username,
                    created_at: created_at,
                    content: content
                });
            }
        });
        data.cast = []
        var service_point3 = "https://api.themoviedb.org/3/movie/" + videoid + "/credits";
        var castAjax = $.ajax(service_point3, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson3) {
            // Only show 10 cast members
            var counter = 0;
            for (i in detailjson3.cast) {
                if (counter === 10) break;
                var cast_id = detailjson3.cast[i].id;
                var cast_name = detailjson3.cast[i].name ? detailjson3.cast[i].name : "Unknown";
                var cast_character = detailjson3.cast[i].character ? detailjson3.cast[i].character : "Unknown";
                var cast_profile = detailjson3.cast[i].profile_path ? "https://image.tmdb.org/t/p/w500" + detailjson3.cast[i].profile_path : "/images/video-not-found.png";
                data.cast.push({
                    cast_id: cast_id,
                    cast_name: cast_name,
                    cast_character: cast_character,
                    cast_profile: cast_profile
                });
                counter++;
            }
        });
        $.when(reviewsAjax, castAjax).done(function () {
            // Handle templating
            var template = $("#displayMovieDetails").html();
            var resultHTML = Mustache.render(template, data);
            $('#videodetail').html(resultHTML);
        });
    });
}
function displayTVDetails(videoid) {
    var service_point = "https://api.themoviedb.org/3/tv/" + videoid;
    
    $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson) {
        // videodetail div is hidden by default. Show it when a video is clicked
        $("#videodetail").show();
        // Data that is passed to template
        var data = {};

        data.backdrop_path = "https://image.tmdb.org/t/p/w1280/" + detailjson.backdrop_path;
        data.poster_path = detailjson.poster_path ? "https://image.tmdb.org/t/p/w500/" + detailjson.poster_path : "/images/video-not-found.png";
        data.title = detailjson.name ? detailjson.name : "Unknown Title";
        data.first_air_date = detailjson.first_air_date ? detailjson.first_air_date : "Unknown";
        data.last_air_date = detailjson.last_air_date ? detailjson.last_air_date : "Unknown";
        data.number_of_episodes = detailjson.number_of_episodes ? detailjson.number_of_episodes : "Unknown";
        data.overview = detailjson.overview ? detailjson.overview : "No overview is available.";
        data.vote_average = detailjson.vote_average ? detailjson.vote_average : "Unknown";

        // Create multiple spans for each genre
        data.genres = detailjson.genres.map(genre => `<span class="genre">${genre.name}</span>`).join(' ');

        // Create multiple spans for each genre
        data.networks = detailjson.networks
            // Filter out companies with null logo_path
            .filter(network => network.logo_path !== null)
            .map(network => `<img class="prod-company" src="https://image.tmdb.org/t/p/w500${network.logo_path}" alt="">`)
            .join(' ');

        data.reviews = []
        var service_point2 = "https://api.themoviedb.org/3/tv/" + videoid + "/reviews";
        var reviewsAjax = $.ajax(service_point2, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson2) {
            for (i in detailjson2.results) {
                var username = detailjson2.results[i].author_details.username ? detailjson2.results[i].author_details.username : "Unknown";
                var created_at = detailjson2.results[i].created_at ? detailjson2.results[i].created_at : "Creation Date Unknown";
                var content = detailjson2.results[i].content ? detailjson2.results[i].content : "No review is available.";
                data.reviews.push({
                    username: username,
                    created_at: created_at,
                    content: content
                });
            }
        });
        data.cast = []
        var service_point3 = "https://api.themoviedb.org/3/tv/" + videoid + "/credits";
        var castAjax = $.ajax(service_point3, {headers:{'Authorization':'Bearer ' + token}}).done(function (detailjson3) {
            // Only show 10 cast members
            var counter = 0;
            for (i in detailjson3.cast) {
                if (counter === 10) break;
                var cast_id = detailjson3.cast[i].id;
                var cast_name = detailjson3.cast[i].name ? detailjson3.cast[i].name : "Unknown";
                var cast_character = detailjson3.cast[i].character ? detailjson3.cast[i].character : "Unknown";
                var cast_profile = detailjson3.cast[i].profile_path ? "https://image.tmdb.org/t/p/w500" + detailjson3.cast[i].profile_path : "/images/video-not-found.png";
                data.cast.push({
                    cast_id: cast_id,
                    cast_name: cast_name,
                    cast_character: cast_character,
                    cast_profile: cast_profile
                });
                counter++;
            }
        });
        $.when(reviewsAjax, castAjax).done(function () {
            // Handle templating
            var template = $("#displayTVDetails").html();
            var resultHTML = Mustache.render(template, data);
            $('#videodetail').html(resultHTML);
        });
    });
}
function displayTopMovies(page) {
    var service_point = "https://api.themoviedb.org/3/discover/movie?include_adult=false&language=en-US&sort_by=popularity.desc&page=" + page;
    
    $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (json) {
        // The following data with array will be passed to Mustache template
        var displayTopMoviesTemplate = {
            videos: []
        };
        for (i in json.results) {
            var title = json.results[i].title;
            var id = json.results[i].id;
            var poster_path = json.results[i].poster_path;
            var poster = poster_path ? "https://image.tmdb.org/t/p/w500" + poster_path : "/images/video-not-found.png";

            displayTopMoviesTemplate.videos.push({
                videotitle: title,
                videoid: id,
                cover: poster
            });
        }
        // Handle templating
        var template = $("#displayMovieVideos").html();
        var resultHTML = Mustache.render(template, displayTopMoviesTemplate);
        $("#videocontainer").html(resultHTML);
        
        
        $("#resultcount").text("Popular Movies");
        var layoutbtns = "";
        if (currentLayoutType === 'list') {
            layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn active' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
            layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
        } else {
            layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
            layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn active' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
        }
        $("#resultcount").append(layoutbtns);

        // Create page number buttons
        var buttonHTML = "";
        for (var i = 1; i <= 8; i++) {
            // CSS changes to page buttons to clearly indicate which page is selected
            if (i === page) {
                buttonHTML += "<button type='button' class='pagebtn-topm active' data-page='" + i + "'>" + i + "</button> ";
            } else {
                buttonHTML += "<button type='button' class='pagebtn-topm' data-page='" + i + "'>" + i + "</button> ";
            }
        }
        $("#pagination").html(buttonHTML);
    });
}
function displayTopTVShows(page) {
    var service_point = "https://api.themoviedb.org/3/discover/tv?include_adult=false&language=en-US&sort_by=popularity.desc&page=" + page;
    
    $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (json) {
        // The following data with array will be passed to Mustache template
        var displayTopTVShowsTemplate = {
            videos: []
        };
        for (i in json.results) {
            var title = json.results[i].name;
            var id = json.results[i].id;
            var poster_path = json.results[i].poster_path;
            var poster = poster_path ? "https://image.tmdb.org/t/p/w500" + poster_path : "/images/video-not-found.png";

            displayTopTVShowsTemplate.videos.push({
                videotitle: title,
                videoid: id,
                cover: poster
            });
        }
        // Handle templating
        var template = $("#displayTVVideos").html();
        var resultHTML = Mustache.render(template, displayTopTVShowsTemplate);
        $("#videocontainer2").html(resultHTML);


        var total = json.totalItems;
        $("#resultcount2").text("Popular TV Shows");
        var layoutbtns = "";
        if (currentLayoutType === 'list') {
            layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn active' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
            layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
        } else {
            layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
            layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn active' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
        }
        $("#resultcount2").append(layoutbtns);

        // Create page number buttons
        var buttonHTML = "";
        for (var i = 1; i <= 8; i++) {
            // CSS changes to page buttons to clearly indicate which page is selected
            if (i === page) {
                buttonHTML += "<button type='button' class='pagebtn-topt active' data-page='" + i + "'>" + i + "</button> ";
            } else {
                buttonHTML += "<button type='button' class='pagebtn-topt' data-page='" + i + "'>" + i + "</button> ";
            }
        }
        $("#pagination2").html(buttonHTML);
    });
}

function performMovieSearch(page) {
    // Get the value of the search input
    var term = $('#search-input-m').val().trim();
    if(term !== "") {
        var service_point = "https://api.themoviedb.org/3/search/movie?page=" + page + "&query=" + term;
        $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (json) {
            // The following data with array will be passed to Mustache template
            var displayTopMoviesTemplate = {
                videos: []
            };
            for (i in json.results) {
                var title = json.results[i].title;
                var id = json.results[i].id;
                var poster_path = json.results[i].poster_path;
                var poster = poster_path ? "https://image.tmdb.org/t/p/w500" + poster_path : "/images/video-not-found.png";

                displayTopMoviesTemplate.videos.push({
                    videotitle: title,
                    videoid: id,
                    cover: poster
                });
            }
            // Handle templating
            var template = $("#displayMovieVideos").html();
            var resultHTML = Mustache.render(template, displayTopMoviesTemplate);
            $("#videocontainer3").html(resultHTML);
            
            
            $("#resultcount3").text("Results for '" + term + "'");
            var layoutbtns = "";
            if (currentLayoutType === 'list') {
                layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn active' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
                layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
            } else {
                layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
                layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn active' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
            }
            $("#resultcount3").append(layoutbtns);

            // Create page number buttons
            var buttonHTML = "";
            for (var i = 1; i <= 5; i++) {
                // CSS changes to page buttons to clearly indicate which page is selected
                if (i === page) {
                    buttonHTML += "<button type='button' class='pagebtn-ms active' data-page='" + i + "'>" + i + "</button> ";
                } else {
                    buttonHTML += "<button type='button' class='pagebtn-ms' data-page='" + i + "'>" + i + "</button> ";
                }
            }
            $("#pagination3").html(buttonHTML);
        });
    } else {
        // Show error message if input is empty
        $("#resultcount3").text("Please enter a search term"); 
    }
}

function performTVSearch(page) {
    // Get the value of the search input
    var term = $('#search-input-t').val().trim();
    if(term !== "") {
        var service_point = "https://api.themoviedb.org/3/search/tv?page=" + page + "&query=" + term;
        $.ajax(service_point, {headers:{'Authorization':'Bearer ' + token}}).done(function (json) {
            // The following data with array will be passed to Mustache template
            var displayTopTVShowsTemplate = {
                videos: []
            };
            for (i in json.results) {
                var title = json.results[i].name;
                var id = json.results[i].id;
                var poster_path = json.results[i].poster_path;
                var poster = poster_path ? "https://image.tmdb.org/t/p/w500" + poster_path : "/images/video-not-found.png";
    
                displayTopTVShowsTemplate.videos.push({
                    videotitle: title,
                    videoid: id,
                    cover: poster
                });
            }
            // Handle templating
            var template = $("#displayTVVideos").html();
            var resultHTML = Mustache.render(template, displayTopTVShowsTemplate);
            $("#videocontainer4").html(resultHTML);
            
            
            $("#resultcount4").text("Results for '" + term + "'");
            var layoutbtns = "";
            if (currentLayoutType === 'list') {
                layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn active' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
                layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
            } else {
                layoutbtns += "<button type='button' class='layoutbtn2 layoutbtn' data-layout='list'><img src='/images/list.png' alt='List' class='layoutbtnimg'></button> ";
                layoutbtns += "<button type='button' class='layoutbtn1 layoutbtn active' data-layout='grid'><img src='/images/grid.png' alt='Grid' class='layoutbtnimg'></button> ";
            }
            $("#resultcount4").append(layoutbtns);

            // Create page number buttons
            var buttonHTML = "";
            for (var i = 1; i <= 5; i++) {
                // CSS changes to page buttons to clearly indicate which page is selected
                if (i === page) {
                    buttonHTML += "<button type='button' class='pagebtn-ts active' data-page='" + i + "'>" + i + "</button> ";
                } else {
                    buttonHTML += "<button type='button' class='pagebtn-ts' data-page='" + i + "'>" + i + "</button> ";
                }
            }
            $("#pagination4").html(buttonHTML);
        });
    } else {
        // Show error message if input is empty
        $("#resultcount4").text("Please enter a search term"); 
    }
}

// Page Views (tabs)
function showTopMovies() {
    // Update CSS class for active tab
    updateActiveLink('Top Movies');
    // Clear, hide, and show elements to simulate tab switch
    $("#videodetail").hide();
    $(".searchform").hide();
    $(".searchform2").hide();
    $("#moviesearchinfo").hide();
    $("#tvsearchinfo").hide();
    $("#resultcount").show();
    $("#resultcount2").hide();
    $("#resultcount3").hide();
    $("#resultcount4").hide();

    $("#pagination").show();
    $("#pagination2").hide();
    $("#pagination3").hide();
    $("#pagination4").hide();
    $("#videocontainer").show();
    $("#videocontainer2").hide();
    $("#videocontainer3").hide();
    $("#videocontainer4").hide();
    applyLayout(currentLayoutType);
}
function showTopTVShows() {
    // Update CSS class for active tab
    updateActiveLink('Top TV Shows');
    // Clear, hide, and show elements to simulate tab switch
    $("#videodetail").hide();
    $(".searchform").hide();
    $(".searchform2").hide();
    $("#moviesearchinfo").hide();
    $("#tvsearchinfo").hide();

    $("#resultcount").hide();
    $("#resultcount2").show();
    $("#resultcount3").hide();
    $("#resultcount4").hide();
    $("#pagination").hide();
    $("#pagination2").show();
    $("#pagination3").hide();
    $("#pagination4").hide();
    $("#videocontainer").hide();
    $("#videocontainer2").show();
    $("#videocontainer3").hide();
    $("#videocontainer4").hide();
    applyLayout(currentLayoutType);
    displayTopTVShows(1);
}
function showMovieSearch() {
    // Update CSS class for active tab
    updateActiveLink('Movie Search');
    // Clear, hide, and show elements to simulate tab switch
    $("#videodetail").hide();
    $(".searchform").show();
    $(".searchform2").hide();
    $("#moviesearchinfo").show();
    $("#tvsearchinfo").hide();

    $("#resultcount").hide();
    $("#resultcount2").hide();
    $("#resultcount3").show();
    $("#resultcount4").hide();
    $("#pagination").hide();
    $("#pagination2").hide();
    $("#pagination3").show();
    $("#pagination4").hide();
    $("#videocontainer").hide();
    $("#videocontainer2").hide();
    $("#videocontainer3").show();
    $("#videocontainer4").hide();
}
function showTVShowSearch() {
    // Update CSS class for active tab
    updateActiveLink('TV Show Search');
    // Clear, hide, and show elements to simulate tab switch
    $("#videodetail").hide();
    $(".searchform").hide();
    $(".searchform2").show();
    $("#moviesearchinfo").hide();
    $("#tvsearchinfo").show();

    $("#resultcount").hide();
    $("#resultcount2").hide();
    $("#resultcount3").hide();
    $("#resultcount4").show();
    $("#pagination").hide();
    $("#pagination2").hide();
    $("#pagination3").hide();
    $("#pagination4").show();
    $("#videocontainer").hide();
    $("#videocontainer2").hide();
    $("#videocontainer3").hide();
    $("#videocontainer4").show();
}
// Update CSS class for active tab
function updateActiveLink(clickedItem) {
    const links = document.querySelectorAll('.navlinks li');
    links.forEach(li => {
        // Access the span inside each li
        const spanText = li.querySelector('span').textContent;
        if (spanText === clickedItem) {
            li.className = 'navactive';
        } else {
            li.className = 'navinactive';
        }
    });
}

// Handle page button clicks (Top Movies View)
$(document).on('click', '.pagebtn-topm', function() {
    var selectedPage = $(this).data('page');
    currentPage = parseInt(selectedPage);
    displayTopMovies(currentPage);
});
// Handle page button clicks (Top TV Shows View)
$(document).on('click', '.pagebtn-topt', function() {
    var selectedPage = $(this).data('page');
    currentPage = parseInt(selectedPage);
    displayTopTVShows(currentPage);
});
// Handle page button clicks (Movie Search View)
$(document).on('click', '.pagebtn-ms', function() {
    var selectedPage = $(this).data('page');
    currentPage = parseInt(selectedPage);
    performMovieSearch(currentPage);
});
// Handle page button clicks (Movie Search View)
$(document).on('click', '.pagebtn-ts', function() {
    var selectedPage = $(this).data('page');
    currentPage = parseInt(selectedPage);
    performTVSearch(currentPage);
});
// Cast Details div within tv/movie details modal
$(document).on('click', '.cast', function () {
    const castId = $(this).data('castid');
    castDetails(castId);
});