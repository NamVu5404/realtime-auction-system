package com.namvu.realtimeauctionsystem.modules.wishlist.repository;

import com.namvu.realtimeauctionsystem.modules.wishlist.entity.WishList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Repository
public interface WishListRepository extends JpaRepository<WishList, Long> {

    @Query(value = "SELECT w FROM WishList w JOIN FETCH w.auction a JOIN FETCH a.seller WHERE w.user.id = :userId ORDER BY w.createdAt DESC",
            countQuery = "SELECT COUNT(w) FROM WishList w WHERE w.user.id = :userId")
    Page<WishList> findByUserIdWithAuction(@Param("userId") Long userId, Pageable pageable);

    boolean existsByUserIdAndAuctionId(Long userId, Long auctionId);

    @Query("SELECT w.auction.id FROM WishList w WHERE w.user.id = :userId AND w.auction.id IN :auctionIds")
    Set<Long> findWishListedAuctionIds(@Param("userId") Long userId, @Param("auctionIds") List<Long> auctionIds);

    @Transactional
    void deleteByUserIdAndAuctionId(Long userId, Long auctionId);

    @Query("SELECT w.user.id FROM WishList w WHERE w.auction.id = :auctionId")
    Set<Long> findUserIdsByAuctionId(@Param("auctionId") Long auctionId);
}
