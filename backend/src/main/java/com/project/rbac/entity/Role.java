package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

/**
 * Role Entity - Represents user roles (ADMIN, USER)
 * Used for Role-Based Access Control
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@ToString(exclude = "users")
@EqualsAndHashCode(exclude = "users")
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private RoleName name;

    @Column(length = 255)
    private String description;

    /**
     * Many-to-Many relationship with User
     * A role can be assigned to multiple users
     */
    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    public Role(RoleName name) {
        this.name = name;
    }

    public Role(RoleName name, String description) {
        this.name = name;
        this.description = description;
    }
}
