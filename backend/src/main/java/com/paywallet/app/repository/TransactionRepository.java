package com.paywallet.app.repository;

import com.paywallet.app.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access for {@link Transaction} entities.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findBySenderWalletIdOrReceiverWalletId(Long senderWalletId, Long receiverWalletId);

    List<Transaction> findBySenderWalletId(Long senderWalletId);

    List<Transaction> findByReceiverWalletId(Long receiverWalletId);
}

