package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Categories;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Categories, Long> {
}
