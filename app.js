const fs = require('fs');

let global_movies = undefined;
let movie_lookup_table = {};


/**
 * Give imdb link, parses movie title id
 * @param {string} link
 * @return {string} movie title id
 */
const parse_imdb_id = link => {
  const splitted = link.split('/');
  return splitted[4];
}

/**
 * Parses csv file for movies data
 * @param {string} filePath File path to extract movies data from
 * @return {array} array of movie objects.
 */
const parse_data = filePath => {

  // If data is already parsed, return global_movies
  if (global_movies && global_movies.length > 0) {
    return global_movies;
  }

  const lines = fs.readFileSync(filePath).toString().split('\n');
  const keys = lines[0].replace('\r', '').split(',');
  let linesArray = lines.filter( (line, index) => {
    // Remove first line and any empty line
    return line.length > 0 && index !== 0;
  })
  linesArray = linesArray.map(line => {
    // Convert commas inside qutations to pipes(|)
    const strsWithQuotations = line.match(/(["])(?:(?=(\\?))\2.)*?\1/g);
    if (strsWithQuotations) {
      strsWithQuotations.forEach(str => {
        // Turn commas in quotations to pipes temporarily
        let strWithPipes = str.replace(/,/g,'|');
        // Truncate quotations
        strWithPipes = strWithPipes.slice(1, str.length - 1);
        line = line.replace(str, strWithPipes);
      });
    }
    // Split by commas
    let lineArray = line.replace('\r', '').split(',');

    // Convert pipes back to commas.
    lineArray = lineArray.map(each => {
      return each.replace(/\|/g, ',').trim();
    });

    return lineArray;
  })

  //Convert each movie data to object
  const moviesObj = linesArray.map( anArray => {

    const movieObj = anArray.reduce((acc, value, index) => {
      acc[keys[index]] = value;
      return acc;
    }, {});

    // Populate movie lookup table
    const movieId = parse_imdb_id(movieObj.movie_imdb_link);
    // Take care of duplicat movie
    if (movie_lookup_table[movieId]) {
      return null;
    }
    movie_lookup_table[movieId] = movieObj;

    return movieObj;
  }).filter( movie => movie); // Take care of duplicate movie

  global_movies = moviesObj;
  return moviesObj;
}

/**
 * Get movie objects
 * @return Returns array of movie objects
 */
const get_movies = () => {
  return parse_data('movie_metadata.csv');
}

/**
 * Get specific movie object
 * @param {string} id Movie title id
 */
const get_movie = id => {
  return movie_lookup_table[id];
}


/**
 * Return true if genre string contains either Sci-Fi or Adventure
 * @param {string} genre: genre(s) separated by comma(,).
 */
const sciFiOrFantasy = genre => {
  return genre.includes('Sci-Fi') || genre.includes('Adventure');
}

/**
 * Get Fractal score
 * @param {string} id Movie title id
 * @return fractal score
 *
 * 2.3 * imdb_score minus (the release year divided by 2000) plus a 1.5 bonus if the genre is either Sci-Fi or Fantasy
 */
const get_score = id => {
  const movie = get_movie(id);
  const imdb_score = Number(movie.imdb_score);
  const movie_year = Number(movie.title_year)
  const sciFiFantasyBonus = sciFiOrFantasy(movie.genres) ? 1.5 : 0;
  return imdb_score * 2.3 - movie_year / 2000 + sciFiFantasyBonus;
}

/**
 * Check for user's favorite genre
 * @param {string} movie_genres
 * @param {string} user_genres
 */
const containsFavoriteGenre = (movie_genres, user_genres) => {
  return user_genres.split('|').reduce((acc, genre) => {
    return acc || movie_genres.includes(genre);
  }, false);
}


/**
 * Calculate user specific score
 * @param {string} id Movie title id
 * @param {object} user hash
 *
 */
const get_user_score = (id, user) => {
  const fractalScore = get_score(id);
  const movie = get_movie(id);
  const movie_year = Number(movie.title_year);
  const userScore = fractalScore + (movie_year < 1970 && user.likes_old_movies ? 2.5 : 0)
                    + (containsFavoriteGenre(movie.genres, user.favorite_genres) ? 3.5 : 0);
  return userScore;
}



/**
 * Get top 10 movies that the user will favor the most.
 * @param {object} user hash
 */
const get_top_10_movies_for_user = user => {
  let movies = get_movies();
  movies = movies.map( movie => {
    movie.user_specific_score = get_user_score(parse_imdb_id(movie.movie_imdb_link), user);
    return movie;
  });

  // Sort movie based on user score.
  return movies.sort((a, b) => {
    return b.user_specific_score - a.user_specific_score;
  }).map(movie => {
    // Get title and user_specific_score only
    return {
      movie_title: movie.movie_title,
      // User score rounded to hundredths place
      user_specific_score: Math.round(movie.user_specific_score * 100) / 100
    }

  }).slice(0, 10);
}


const testUser = {
  id: 12,
  likes_old_movies: true,
  favorite_genres: 'Action|Sci-Fi'
};
const top10Result = get_top_10_movies_for_user(testUser);
console.log('top10', top10Result);
