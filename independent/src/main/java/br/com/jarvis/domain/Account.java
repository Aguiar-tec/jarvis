package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="users")
public class Account extends BaseEntity {

 @Column(nullable=false,length=150) public String name;
 @Column(nullable=false,length=254,unique=true) public String email;
 @Column(name="password_hash",nullable=false,length=255) public String passwordHash;
}
