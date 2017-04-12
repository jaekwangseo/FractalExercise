const fs = require('fs');

let global_movies = undefined;

const parse_data = filePath => {

  if (global_movies && global_movies.length > 0) {
    return global_movies;
  }

  const lines = fs.readFileSync(filePath).toString().split('\n');
  const linesArray = lines.filter(line => {
    // Ignore empty line
    return line.trim() !== '';
  }).map(line => {
    // Convert string into an array
    return line.replace('\r', '').split(',');
  })
  // console.log('this is running');

  // First line contains labels for each column
  const keys = linesArray.shift();

  //Convert each movie data to object
  const linesObj = linesArray.map( anArray => {
    const obj = anArray.reduce((acc, value, index) => {
      acc[keys[index]] = value;
      return acc;
    }, {});
    return obj;
  })

  global_movies = linesObj;
  return linesObj;
}

/**
 * sample: http://www.imdb.com/title/tt0499549/?ref_=fn_tt_tt_1
 * @param {*} link
 */
const parse_imdb_id = link => {
  const splitted = link.split('/');
  return splitted[4];
}


const get_movies = path => {
  return parse_data(path);
}

/**
 *
 * @param {string} id
 */
const get_movie = id => {

  const movies = get_movies('movie_metadata.csv');
  const filtered = movies.filter(movie => {
    return parse_imdb_id(movie.movie_imdb_link) === id
  })

  if (filtered.length > 0) {
    return filtered[0];
  }
  return null;
}


/**
 * exmpale: Action|Adventure|Thriller
 * @param {string} genre: genre(s) separated by pipes(|).
 */
const sciFiOrFantasy = genre => {
  return genre.includes('Sci-Fi') || genre.includes('Adventure');
}

/**
 *
 * @param {* movie’s imdb title id} id
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


const containsFavoriteGenre = (movie_genres, user_genres) => {
  return user_genres.split('|').reduce((acc, genre) => {
    return acc || movie_genres.includes(genre);
  }, false);
}


/**
 *
 * @param {string} id =  movie's imdb title id} id
 * @param {object} user hash
 *
 *
 *  we want to give a 2.5 bonus for movies released before 1970 if the user prefers old movies
 *  and a 3.5 bonus if the movie genre matches one of the movie favorites.
 */
const get_user_score = (id, user) => {
  const fractalScore = get_score(id);
  const movie = get_movie(id);
  const movie_year = Number(movie.title_year);
  const userScore = fractalScore + (movie_year < 1970 && user.likes_old_movies ? 2.5 : 0)
                    + (containsFavoriteGenre(movie.genres, user.favorite_genres) ? 3.5 : 0);
  return userScore;
}




const get_top_10_movies_for_user = user => {
  let movies = get_movies('movie_metadata.csv');
  // console.log('after get_movies');
  movies = movies.map(movie => {
    // console.log('movie:', movie)
    movie.user_specific_score = get_user_score(parse_imdb_id(movie.movie_imdb_link), user);
    return movie;
  });

  return movies.sort((a, b) => {
    return b.user_specific_score - a.user_specific_score;
  }).slice(0, 10);
}
const user = {
  id: 12,
  likes_old_movies: true,
  favorite_genres: 'Action|Sci-Fi|Drama'
};
const top10Result = get_top_10_movies_for_user(user);
console.log(top10Result);
