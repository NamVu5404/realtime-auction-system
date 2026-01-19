package com.NamVu.TeamTaskManager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "`user`")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {
    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(length = 10)
    private String phone;

    private LocalDate dob;

    @Column(nullable = false)
    private byte isGuest;
}
