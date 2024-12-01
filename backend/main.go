package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"errors"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
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

type Work struct {
	Id          int       `json:"id"`
	Title       string    `json:"title"`
	Author      string    `json:"author"`
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
		CREATE TABLE IF NOT EXISTS works (
			id SERIAL PRIMARY KEY, 
			title VARCHAR(255) NOT NULL, 
			author VARCHAR(255) NOT NULL, 
			content_type VARCHAR(50) NOT NULL,
			category VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			is_published BOOLEAN DEFAULT FALSE
		);
		CREATE TABLE IF NOT EXISTS images (
			id SERIAL PRIMARY KEY,
			work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
			image_path VARCHAR(255) NOT NULL,
			image_name VARCHAR(255) NOT NULL 
		);
		CREATE TABLE IF NOT EXISTS texts (
			id SERIAL PRIMARY KEY,
			work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
			content TEXT NOT NULL 
		);`

	_, err = db.Exec(query)
	if err != nil {
		log.Fatal(err)
	}

	// create router
	router := mux.NewRouter()
	router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("/app/uploads"))))

	router.HandleFunc("/api/works", getWorks(db)).Methods("GET")
	router.HandleFunc("/api/works/{category}", getCategoryWorks(db)).Methods("GET")
	router.HandleFunc("/api/work/{id}", getWork(db)).Methods("GET")

	router.HandleFunc("/api/admin/login", adminLogin(db)).Methods("POST")
	router.HandleFunc("/api/users/{id}", getUser(db)).Methods("GET")
	router.HandleFunc("/api/users/{id}", updateUser(db)).Methods("PUT")
	router.Handle("/api/admin/dashboard", authenticate(http.HandlerFunc(dashboardHandler))).Methods("GET")

	router.HandleFunc("/api/works", createWork(db)).Methods("POST")
	router.HandleFunc("/api/works/{id}", updateWork(db)).Methods("PUT")
	router.HandleFunc("/api/works/{id}", deleteWork(db)).Methods("DELETE")
	router.HandleFunc("/api/work/{id}", publishWork(db)).Methods("PUT")

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

// get all works
func getWorks(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(`SELECT id, title, content_type, created_at, category, is_published FROM works`)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var works []Work
		for rows.Next() {
			var work Work

			if err := rows.Scan(&work.Id, &work.Title, &work.ContentType, &work.CreatedAt, &work.Category, &work.IsPublished); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			works = append(works, work)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(works)
	}
}

// get category works
func getCategoryWorks(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		category := vars["category"]

		rows, err := db.Query(`SELECT id, title, content_type, author, created_at, category, is_published FROM works 
		WHERE category = $1`, category)
		if err != nil {
			http.Error(w, "Error querying database: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var works []Work

		for rows.Next() {
			var work Work
			err := rows.Scan(&work.Id, &work.Title, &work.ContentType, &work.Author, &work.CreatedAt, &work.Category, &work.IsPublished)

			if err != nil {
				http.Error(w, "Error scanning row: "+err.Error(), http.StatusInternalServerError)
				return
			}
			works = append(works, work)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(works)
	}
}

// get single work
func getWork(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var work Work

		err := db.QueryRow(`
            SELECT 
                work.id, work.title, work.author, work.content_type, work.category, work.created_at, work.updated_at, work.is_published,
                t.content, i.image_path, i.image_name
            FROM works work 
            LEFT JOIN texts t ON work.id = t.work_id 
            LEFT JOIN images i ON work.id = i.work_id 
            WHERE work.id = $1`, id).Scan(
			&work.Id, &work.Title, &work.Author, &work.ContentType, &work.Category, &work.CreatedAt, &work.UpdatedAt, &work.IsPublished,
			&work.Content, &work.ImagePath, &work.ImageName)
		if err == sql.ErrNoRows {
			http.Error(w, "Work not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Error retrieving work: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(work)
	}
}

// create work
func createWork(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		title := r.FormValue("title")
		author := r.FormValue("author")
		category := r.FormValue("category")
		contentType := r.FormValue("content_type")
		content := r.FormValue("content")

		if title == "" || author == "" || category == "" || contentType == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		if (contentType == "text" && (category != "poem" && category != "story")) ||
			(contentType == "image" && (category != "pixel-art" && category != "glitch-art" && category != "digital-art" && category != "photography")) {
			http.Error(w, "Category must be relevant with content type", http.StatusBadRequest)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "Failed to start transaction: "+err.Error(), http.StatusInternalServerError)
			return
		}

		var workID int
		err = tx.QueryRow(`
			INSERT INTO works (title, author, content_type, category, created_at, updated_at, is_published)
			VALUES ($1, $2, $3, $4, NOW(), NOW(), $5) RETURNING id`,
			title, author, contentType, category, true).Scan(&workID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to insert work: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if contentType == "image" {
			file, handler, err := r.FormFile("file")
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to read uploaded file: "+err.Error(), http.StatusBadRequest)
				return
			}
			defer file.Close()

			uploadDir := "uploads"
			if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
				tx.Rollback()
				http.Error(w, "Failed to create upload directory: "+err.Error(), http.StatusInternalServerError)
				return
			}

			ext := filepath.Ext(handler.Filename)
			uniqueFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

			filePath := filepath.Join(uploadDir, uniqueFilename)
			out, err := os.Create(filePath)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to save file: "+err.Error(), http.StatusInternalServerError)
				return
			}
			defer out.Close()
			if _, err := io.Copy(out, file); err != nil {
				tx.Rollback()
				http.Error(w, "Failed to write file: "+err.Error(), http.StatusInternalServerError)
				return
			}

			_, err = tx.Exec(`INSERT INTO images (work_id, image_path, image_name) VALUES ($1, $2, $3)`,
				workID, filePath, uniqueFilename)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to save image metadata: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		if contentType == "text" {
			_, err := tx.Exec(`INSERT INTO texts (work_id, content) VALUES ($1, $2)`, workID, content)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Failed to save text content: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, "Failed to commit transaction: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":           workID,
			"title":        title,
			"author":       author,
			"category":     category,
			"content_type": contentType,
		})
	}
}

// update work
func updateWork(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		var work Work

		if err := json.NewDecoder(r.Body).Decode(&work); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		_, err := db.Exec("UPDATE works SET title = $1, author = $2, content_type = $3, category=$4, updated_at = NOW(), is_published = $5 WHERE id = $6",
			work.Title, work.Author, work.ContentType, work.Category, work.IsPublished, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if work.ContentType == "image" {
			_, err := db.Exec(`UPDATE images SET image_path = $1, image_name = $2 WHERE work_id = $3`, work.ImagePath, work.ImageName, id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		} else if work.ContentType == "text" {
			_, err := db.Exec(`UPDATE texts SET content = $1 WHERE work_id = $2`, work.Content, id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		var updatedWork Work
		err = db.QueryRow(`
			SELECT id, title, author, content_type, category, created_at, updated_at, is_published FROM works WHERE id = $1`, id).Scan(
			&updatedWork.Id, &updatedWork.Title, &updatedWork.Author, &updatedWork.ContentType, &updatedWork.Category,
			&updatedWork.CreatedAt, &updatedWork.UpdatedAt, &updatedWork.IsPublished)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(updatedWork)
		w.WriteHeader(http.StatusOK)
	}
}

// delete work
func deleteWork(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var work Work
		err := db.QueryRow("SELECT id, title, author FROM works WHERE id = $1", id).Scan(&work.Id, &work.Title, &work.Author)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		} else {
			_, err := db.Exec("DELETE FROM works WHERE id = $1", id)
			if err != nil {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			json.NewEncoder(w).Encode("Work deleted")
		}
	}
}

// publish the work
func publishWork(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		_, err := db.Exec("UPDATE works SET updated_at = NOW(), is_published = NOT is_published WHERE id = $1", id)
		if err != nil {
			http.Error(w, "failed to change visibility of the work: "+err.Error(), http.StatusInternalServerError)
			return
		}

		var updatedWork Work
		err = db.QueryRow(`
			SELECT id, title, author, content_type, category, created_at, updated_at, is_published FROM works WHERE id = $1`, id).Scan(
			&updatedWork.Id, &updatedWork.Title, &updatedWork.Author, &updatedWork.ContentType, &updatedWork.Category,
			&updatedWork.CreatedAt, &updatedWork.UpdatedAt, &updatedWork.IsPublished)

		if err != nil {
			http.Error(w, "failed to fetch updated work: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(updatedWork)

	}
}

func authenticate(next http.Handler) http.Handler {
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

func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{}`))
}
