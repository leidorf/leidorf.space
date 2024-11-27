package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"errors"
	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"strings"
)

var secretKey = []byte(os.Getenv("JWT_SECRET_KEY"))

type User struct {
	Id        int    `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type Post struct {
	Id          int       `json:"id"`
	Title       string    `json:"title"`
	AuthorName  string    `json:"author_name"`
	ContentType string    `json:"content_type"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IsPublished bool      `json:"is_published"`
	Content     *string   `json:"content,omitempty"`
	ImagePath   *string   `json:"image_path,omitempty"`
	ImageName   *string   `json:"image_name,omitempty"`
}

func main() {
	// connect to db
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// create table if not exists
	query := `
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY, 
			username VARCHAR(255) NOT NULL, 
			email TEXT NOT NULL UNIQUE, 
			password VARCHAR(255) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS posts (
			id SERIAL PRIMARY KEY, 
			title VARCHAR(255) NOT NULL, 
			author_name VARCHAR(255) NOT NULL, 
			content_type VARCHAR(50) NOT NULL,
			category VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			is_published BOOLEAN DEFAULT FALSE
		);
		CREATE TABLE IF NOT EXISTS images (
			id SERIAL PRIMARY KEY,
			post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
			image_path VARCHAR(255) NOT NULL,
			image_name VARCHAR(255) NOT NULL 
		);
		CREATE TABLE IF NOT EXISTS writings (
			id SERIAL PRIMARY KEY,
			post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
			content TEXT NOT NULL 
		);`

	_, err = db.Exec(query)
	if err != nil {
		log.Fatal(err)
	}

	// create router
	router := mux.NewRouter()
	router.HandleFunc("/api/users/{id}", getUser(db)).Methods("GET")
	router.HandleFunc("/api/users/{id}", updateUser(db)).Methods("PUT")
	router.HandleFunc("/api/admin/login", adminLogin(db)).Methods("POST")

	router.HandleFunc("/api/posts", createPost(db)).Methods("POST")
	router.HandleFunc("/api/posts/{id}", updatePost(db)).Methods("PUT")
	router.HandleFunc("/api/posts/{id}", deletePost(db)).Methods("DELETE")
	router.HandleFunc("/api/post/{id}", publishPost(db)).Methods("PUT")

	router.HandleFunc("/api/posts", getPosts(db)).Methods("GET")
	router.HandleFunc("/api/posts/{category}", getCategoryPosts(db)).Methods("GET")
	router.HandleFunc("/api/post/{id}", getPost(db)).Methods("GET")

	// wrap the router with CORS and JSON content type middlewares
	enhancedRouter := enableCORS(jsonContentTypeMiddleware(router))

	// start server
	log.Fatal(http.ListenAndServe(":8000", enhancedRouter))
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // allow any origin
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
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

func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// get single user
func getUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var u User
		err := db.QueryRow("SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1", id).Scan(
			&u.Id, &u.Username, &u.Email, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(u)
	}
}

// update user
func updateUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var u User
		json.NewDecoder(r.Body).Decode(&u)

		vars := mux.Vars(r)
		id := vars["id"]

		_, err := db.Exec("UPDATE users SET username = $1, email = $2, updated_at = NOW() WHERE id = $3", u.Username, u.Email, id)
		if err != nil {
			log.Fatal(err)
		}

		var updatedUser User
		err = db.QueryRow("SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1", id).Scan(
			&u.Id, &u.Username, &u.Email, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			log.Fatal(err)
		}
		json.NewEncoder(w).Encode(updatedUser)
	}
}

// get all posts
func getPosts(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(`SELECT id, title, content_type, created_at, category, is_published FROM posts`)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var post Post

			if err := rows.Scan(&post.Id, &post.Title, &post.ContentType, &post.CreatedAt, &post.Category, &post.IsPublished); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			posts = append(posts, post)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}

// get category posts
func getCategoryPosts(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		category := vars["category"]

		rows, err := db.Query(`SELECT id, title, content_type, author_name, created_at, category, is_published FROM posts 
		WHERE category = $1`, category)
		if err != nil {
			http.Error(w, "Error querying database: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post

		for rows.Next() {
			var post Post
			err := rows.Scan(&post.Id, &post.Title, &post.ContentType, &post.AuthorName, &post.CreatedAt, &post.Category, &post.IsPublished)

			if err != nil {
				http.Error(w, "Error scanning row: "+err.Error(), http.StatusInternalServerError)
				return
			}
			posts = append(posts, post)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}

// get single post
func getPost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var p Post

		err := db.QueryRow(`
            SELECT 
                p.id, p.title, p.author_name, p.content_type, p.category, p.created_at, p.updated_at, p.is_published,
                w.content, i.image_path, i.image_name
            FROM posts p 
            LEFT JOIN writings w ON p.id = w.post_id 
            LEFT JOIN images i ON p.id = i.post_id 
            WHERE p.id = $1`, id).Scan(
			&p.Id, &p.Title, &p.AuthorName, &p.ContentType, &p.Category, &p.CreatedAt, &p.UpdatedAt, &p.IsPublished,
			&p.Content, &p.ImagePath, &p.ImageName)
		if err == sql.ErrNoRows {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Error retrieving post: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(p)
	}
}

// create post
func createPost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var p Post
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "Invalid request payload: "+err.Error(), http.StatusBadRequest)
			return
		}

		if p.Title == "" || p.ContentType == "" || p.AuthorName == "" || p.Category == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		if (p.ContentType == "text" && (p.Category != "poem" && p.Category != "story")) ||
			(p.ContentType == "image" && (p.Category != "pixel-art" && p.Category != "glitch-art" && p.Category != "digital-art" && p.Category != "photograph")) {
			http.Error(w, "Category must be relevant with content type", http.StatusBadRequest)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "Failed to start transaction:"+err.Error(), http.StatusInternalServerError)
			return
		}

		err = tx.QueryRow(`
		INSERT INTO posts (title, author_name, content_type, category, created_at, updated_at, is_published)
		VALUES ($1, $2, $3, $4, NOW(), NOW(), $5) RETURNING id, created_at, updated_at`,
			p.Title, p.AuthorName, p.ContentType, p.Category, true).Scan(&p.Id, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to create the post: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if p.ContentType == "image" {
			if _, err := tx.Exec(
				`INSERT INTO images (post_id, image_path, image_name) VALUES ($1, $2, $3)`, p.Id, p.ImagePath, p.ImageName); err != nil {
				tx.Rollback()
				http.Error(w, "Failed to insert the image: "+err.Error(), http.StatusInternalServerError)
				return
			}
		} else if p.ContentType == "text" {
			if _, err := tx.Exec(`
			INSERT INTO writings (post_id, content) VALUES ($1,$2)`, p.Id, p.Content); err != nil {
				tx.Rollback()
				http.Error(w, "Failed to insert the content: "+err.Error(), http.StatusInternalServerError)
				return
			}
		} else {
			tx.Rollback()
			http.Error(w, "Unsupported content type", http.StatusBadRequest)
			return
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, "Failed to commit the transaction: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(p)
		w.WriteHeader(http.StatusCreated)
	}
}

// update post
func updatePost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		var p Post

		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		_, err := db.Exec("UPDATE posts SET title = $1, author_name = $2, content_type = $3, category=$4 updated_at = NOW(), is_published = $5 WHERE id = $6",
			&p.Title, &p.AuthorName, &p.ContentType, &p.Category, &p.IsPublished, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if p.ContentType == "image" {
			_, err := db.Exec(`UPDATE images SET image_path = $1, image_name = $2 WHERE post_id = $3`, p.ImagePath, p.ImageName, id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		} else if p.ContentType == "text" {
			_, err := db.Exec(`UPDATE writings SET content = $1 WHERE post_id = $2`, p.Content, id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		var updatedPost Post
		err = db.QueryRow(`
			SELECT id, title, author_name, content_type, category, created_at, updated_at, is_published FROM posts WHERE id = $1`, id).Scan(
			&updatedPost.Id, &updatedPost.Title, &updatedPost.AuthorName, &updatedPost.ContentType, &updatedPost.Category,
			&updatedPost.CreatedAt, &updatedPost.UpdatedAt, &updatedPost.IsPublished)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(updatedPost)
		w.WriteHeader(http.StatusOK)
	}
}

// delete post
func deletePost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var p Post
		err := db.QueryRow("SELECT id, title, author_name FROM posts WHERE id = $1", id).Scan(&p.Id, &p.Title, &p.AuthorName)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		} else {
			_, err := db.Exec("DELETE FROM posts WHERE id = $1", id)
			if err != nil {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			json.NewEncoder(w).Encode("Post deleted")
		}
	}
}

// publish the post
func publishPost(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var p Post
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, err := db.Exec("UPDATE posts SET updated_at = NOW(), is_published = NOT is_published WHERE id = $1", id)
		if err != nil {
			log.Fatal(err)
			return
		}

		var updatedPost Post
		err = db.QueryRow(`
			SELECT id, title, author_name, content_type, category, created_at, updated_at, is_published FROM posts WHERE id = $1`, id).Scan(
			&updatedPost.Id, &updatedPost.Title, &updatedPost.AuthorName, &updatedPost.ContentType, &updatedPost.Category,
			&updatedPost.CreatedAt, &updatedPost.UpdatedAt, &updatedPost.IsPublished)

		if err != nil {
			log.Fatal(err)
		}
		json.NewEncoder(w).Encode(updatedPost)

		w.WriteHeader(http.StatusOK)
	}
}

func adminAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "Authorization token required", http.StatusUnauthorized)
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return secretKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func authMiddleware(handler http.HandlerFunc) http.Handler {
	return adminAuthMiddleware(handler)
}

func adminLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var admin User

		if err := json.NewDecoder(r.Body).Decode(&admin); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var storedPassword string

		err := db.QueryRow("SELECT password FROM users WHERE username = $1", admin.Username).Scan(&storedPassword)
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(admin.Password)); err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"username": admin.Username,
			"exp":      time.Now().Add(time.Hour * 24).Unix(),
		})

		tokenString, err := token.SignedString(secretKey)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"token": tokenString,
		})
	}
}
