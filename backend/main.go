package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type User struct {
	Id       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Post struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	AuthorName  string `json:"author_name"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	IsPublished bool   `json:"is_published"`
}

func main() {
	// connect to db
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// create table if not exists
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY, 
			username TEXT NOT NULL, 
			email TEXT NOT NULL, 
			password TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS posts (
			id SERIAL PRIMARY KEY, 
			title TEXT NOT NULL, 
			content TEXT NOT NULL, 
			author_id INTEGER REFERENCES users(id), 
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			is_published BOOLEAN DEFAULT FALSE
		);
	`)
	if err != nil {
		log.Fatal(err)
	}

	// create router
	router := mux.NewRouter()
	router.HandleFunc("/api/users/{id}", getUser(db)).Methods("GET")
	router.HandleFunc("/api/users/{id}", updateUser(db)).Methods("PUT")

	router.HandleFunc("/api/posts", getPosts(db)).Methods("GET")
	router.HandleFunc("/api/posts", createPost(db)).Methods("POST")
	router.HandleFunc("/api/posts/{id}", getPost(db)).Methods("GET")
	router.HandleFunc("/api/posts/{id}", updatePost(db)).Methods("PUT")
	router.HandleFunc("/api/posts/{id}", deletePost(db)).Methods("DELETE")

	// wrap the router with CORS and JSON content type middlewares
	enhancedRouter := enableCORS(jsonContentTypeMiddleware(router))

	// start server
	log.Fatal(http.ListenAndServe(":8000", enhancedRouter))
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // allow any origin
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// check if the request is for cors preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// pass down the request to the next middleware (or final handler)
		next.ServeHTTP(w, r)
	})
}

//NEED TO CHANGE!!!!
func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json") 
		next.ServeHTTP(w, r)
	})
}

// get single user
func getUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		var user User
		err := db.QueryRow("SELECT id, username, email FROM users WHERE id = $1", id).Scan(&user.Id, &user.Username, &user.Email)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(user)
	}
}

// update user
func updateUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		_, err := db.Exec("UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4",
			user.Username, user.Email, user.Password, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

// get all posts
func getPosts(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT id, title, content, author_id, created_at, updated_at, is_published FROM posts")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var post Post
			if err := rows.Scan(&post.Id, &post.Title, &post.Content, &post.AuthorName, &post.CreatedAt, &post.UpdatedAt, &post.IsPublished); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			posts = append(posts, post)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(posts)
	}
}

// create post
func createPost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var post Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err := db.Exec("INSERT INTO posts(title, content, author_name, created_at, updated_at, is_published) VALUES($1,$2,$3,$4)",
			post.Title, post.Content, post.AuthorName, post.CreatedAt, post.UpdatedAt, post.IsPublished)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	}
}

// get post
func getPost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		var post Post
		err := db.QueryRow("SELECT id, title, content, author_name, created_at, updated_at, is_published FROM posts WHERE id = $1", id).Scan(
			&post.Id, &post.Title, &post.Content, &post.AuthorName, &post.CreatedAt, &post.UpdatedAt, &post.IsPublished)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(post)
	}
}

// update post
func updatePost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		var post Post
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		_, err := db.Exec("UPDATE posts SET title = $1, content = $2, author_name = $3, created_at = $4, updated_at = $5, is_published = $6 WHERE id = $7",
			&post.Title, &post.Content, &post.AuthorName, &post.CreatedAt, &post.UpdatedAt, &post.IsPublished, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

// delete post
func deletePost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		_, err := db.Exec("DELETE posts WHERE id = $1", id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}
