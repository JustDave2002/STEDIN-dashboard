package main

import (
	"database/sql"
	"fmt"
	"log"
)

func SeedMunicipalityData(db *sql.DB, municipalities []string) {
	// Start the transaction
	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("Failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Seed roles dynamically for municipalities
	if err := seedRoles(tx, municipalities); err != nil {
		log.Fatalf("Failed to seed roles: %v", err)
	}

	// Seed members dynamically for municipalities
	if err := seedMembers(tx, municipalities); err != nil {
		log.Fatalf("Failed to seed members: %v", err)
	}

	// Seed tags dynamically for municipalities
	if err := seedTags(tx, municipalities); err != nil {
		log.Fatalf("Failed to seed tags: %v", err)
	}

	// Seed role_tags dynamically for municipalities
	if err := seedRoleTags(tx, municipalities); err != nil {
		log.Fatalf("Failed to seed role_tags: %v", err)
	}

	// Seed meber_roles dynamically for municipalities
	if err := seedMeberRoles(tx, municipalities); err != nil {
		log.Fatalf("Failed to seed meber_roles: %v", err)
	}

	// Seed meber_applications for municipalities with "Straatlampen App"
	if err := seedMeberApplications(tx, municipalities); err != nil {
		log.Fatalf("Failed to seed meber_applications: %v", err)
	}

	// Commit the transaction if all seeds succeed
	if err := tx.Commit(); err != nil {
		log.Fatalf("Failed to commit transaction: %v", err)
	}

	fmt.Println("Municipality data seeded successfully.")
}

// seedRoles inserts dynamic roles for municipalities
func seedRoles(tx *sql.Tx, municipalities []string) error {
	stmt, err := tx.Prepare("INSERT INTO roles (name, description, is_admin, is_restricted) VALUES (?, ?, FALSE, TRUE)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, municipality := range municipalities {
		roleName := fmt.Sprintf("gemeente %s", municipality)
		description := fmt.Sprintf("Role for %s Gemeente", municipality)
		if _, err := stmt.Exec(roleName, description); err != nil {
			return err
		}
	}
	return nil
}

// seedMembers inserts dynamic members for each municipality
func seedMembers(tx *sql.Tx, municipalities []string) error {
	stmt, err := tx.Prepare("INSERT INTO mebers (name) VALUES (?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, municipality := range municipalities {
		memberName := fmt.Sprintf("Gemeente %s Meber", municipality)
		if _, err := stmt.Exec(memberName); err != nil {
			return err
		}
	}
	return nil
}

// seedTags inserts dynamic location tags for each municipality
func seedTags(tx *sql.Tx, municipalities []string) error {
	stmt, err := tx.Prepare("INSERT INTO tags (name, type, is_editable, owner_id) VALUES (?, 'location', FALSE, NULL)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, municipality := range municipalities {
		if _, err := stmt.Exec(municipality); err != nil {
			return err
		}
	}
	return nil
}

// seedRoleTags links each municipality role with its location tag
func seedRoleTags(tx *sql.Tx, municipalities []string) error {
	stmt, err := tx.Prepare(`
		INSERT INTO role_tags (tag_id, role_id)
		SELECT tags.id, roles.id FROM tags
		JOIN roles ON tags.name = ? AND roles.name = ?
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, municipality := range municipalities {
		roleName := fmt.Sprintf("gemeente %s", municipality)
		if _, err := stmt.Exec(municipality, roleName); err != nil {
			return err
		}
	}
	return nil
}

// seedMeberRoles links each municipality member with its role
func seedMeberRoles(tx *sql.Tx, municipalities []string) error {
	stmt, err := tx.Prepare(`
		INSERT INTO meber_roles (meber_id, role_id)
		SELECT mebers.id, roles.id FROM mebers
		JOIN roles ON mebers.name = ? AND roles.name = ?
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, municipality := range municipalities {
		memberName := fmt.Sprintf("Gemeente %s Meber", municipality)
		roleName := fmt.Sprintf("gemeente %s", municipality)
		if _, err := stmt.Exec(memberName, roleName); err != nil {
			return err
		}
	}
	return nil
}

// seedMeberApplications assigns the "Straatlampen App" to each municipality member
func seedMeberApplications(tx *sql.Tx, municipalities []string) error {
	stmt, err := tx.Prepare(`
		INSERT INTO meber_applications (meber_id, application_id)
		SELECT mebers.id, applications.id FROM mebers, applications
		WHERE mebers.name = ? AND applications.name = 'straatlampen app'
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, municipality := range municipalities {
		memberName := fmt.Sprintf("Gemeente %s Meber", municipality)
		if _, err := stmt.Exec(memberName); err != nil {
			return err
		}
	}
	return nil
}
