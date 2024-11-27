package repository

import (
	"fmt"
	"strings"
)

// applyRoleBasedAccess appends role-based access conditions to the provided base query.
func applyRoleBasedAccess(meberID int64, baseQuery string) (string, error) {
	// Fetch roles for the user
	roles, err := GetRolesForMeber(meberID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch roles for meber: %w", err)
	}

	// Check if any role has is_restricted set to false
	for _, role := range roles {
		if !role.IsRestricted {
			// No restrictions, so return the base query unchanged
			return baseQuery, nil
		}
	}

	// Fetch tags for the meber if all roles are restricted
	meberTags, err := GetMeberTags(meberID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch tags for meber: %w", err)
	}

	// If no tags are found, restrict access to nothing
	if len(meberTags) == 0 {
		// Append an always-false condition to the base query
		return insertWhereClause(baseQuery, "1 = 0"), nil
	}

	// Generate the access condition based on the tags
	queryTags := "'" + strings.Join(meberTags, "','") + "'"
	accessClause := fmt.Sprintf("tg.name IN (%s) AND tg.type = 'location'", queryTags)

	// Append the RBAC access clause to the base query
	return insertWhereClause(baseQuery, accessClause), nil
}

// insertWhereClause appends a condition to the query, handling the presence of an existing WHERE & ORDER BY clause.
func insertWhereClause(query string, condition string) string {
	query = strings.TrimSpace(query)

	// Check if the query contains an ORDER BY clause
	orderByIndex := strings.LastIndex(strings.ToUpper(query), "ORDER BY")

	if orderByIndex != -1 {
		// Split the query into the main part and the ORDER BY clause
		mainQuery := query[:orderByIndex]
		orderByClause := query[orderByIndex:]

		// Append the WHERE clause to the main query
		if strings.Contains(strings.ToUpper(mainQuery), "WHERE") {
			// If a WHERE clause already exists, add the condition with AND
			return fmt.Sprintf("%s AND %s %s", mainQuery, condition, orderByClause)
		} else {
			// If no WHERE clause exists, add one
			return fmt.Sprintf("%s WHERE %s %s", mainQuery, condition, orderByClause)
		}
	}

	// If there's no ORDER BY clause, just add the WHERE condition
	if strings.Contains(strings.ToUpper(query), "WHERE") {
		// Add the condition with AND
		return fmt.Sprintf("%s AND %s", query, condition)
	} else {
		// Add the WHERE clause
		return fmt.Sprintf("%s WHERE %s", query, condition)
	}
}
