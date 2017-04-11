const parse = require('csv-parse');
var syncParse = require('csv-parse/lib/sync');
const fs = require('fs');
const readline = require('readline');


const parse_data = filePath => {

  const lines = fs.readFileSync(filePath).toString().split('\n');
  const linesArray = lines.filter(line => {
    // Ignore empty line
    return line.trim() !== '';
  }).map(line => {
    // Convert string into an array
    return line.replace('\r', '').split(',');
  })

  // First line contains labels for each column
  const keys = linesArray.shift();

  //Convert each movie data to object
  linesArray.map( anArray => {
    const obj = anArray.reduce((acc, value, index) => {
      acc[keys[index]] = value;
      return acc;
    }, {});
    return obj;
  })

  return linesArray;
}

/**
 * sample: http://www.imdb.com/title/tt0499549/?ref_=fn_tt_tt_1
 * @param {*} link
 */
const parse_imdb_id = link => {
  const splitted = link.split('/');
  return splitted[4];
}

parse_imdb_id('http://www.imdb.com/title/tt0499549/?ref_=fn_tt_tt_1');

/**
 *
 * @param {* movie’s imdb title id} id
 * @return fractal score
 *
 * 2.3 * imdb_score minus (the release year divided by 2000) plus a 1.5 bonus if the genre is either Sci-Fi or Fantasy
 */
const get_movie = id => {


  return null;
}

const get_score = id => {
  const movie = get_movie(id);
  return movie.imdbScore * 2.3 - (movie.releaseDate/2000) +
        (movie.genre.includes('Sci-Fi') || movie.genre.includes('Fantasy') ? 1.5 : 0 );
}

/**
 *
 * @param {* movie's imdb title id} id
 * @param {* user hash} user
 *
 *
 *  we want to give a 2.5 bonus for movies released before 1970 if the user prefers old movies
 *  and a 3.5 bonus if the movie genre matches one of the movie favorites.
 */
const get_user_score = (id, user) => {
  const fractalScore = get_score(id);
  const movie = get_movie(id);
  const userScore = fractalScore + (movie.releaseDate < 1970 && user.likes_old_movies ? 2.5 : 0)
                    + (user.favorite_genres.includes(movie.genres) ? 3.5 : 0);
  return userScore;
}


const get_movies = () => {
  return movies; //array
}


const get_top_10_movies_for_user = user => {
  const movies = get_movies();
  return movies.sort((a, b) => {
    return get_user_score(b.id) - get_user_score(a.id);
  }).slice(0, 10);
}

const testUser = {
  id: 12,
  likes_old_movies: true,
  favorite_genres: 'Action|Sci-Fi'
};

// console.log(get_top_10_movies_for_user(testUser));

//TEST
// const a = parse_data('movie_metadata_sample.csv');
// console.log(a);
