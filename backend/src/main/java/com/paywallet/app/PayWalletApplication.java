package com.paywallet.app;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
public class PayWalletApplication {

    private static final Logger log = LoggerFactory.getLogger(PayWalletApplication.class);

    public static void main(String[] args) {
        normalizeDatabaseEnvironment();
        SpringApplication.run(PayWalletApplication.class, args);
    }

    /**
     * Inspects and normalizes database environment variables.
     * Supports:
     * - Standard JDBC URLs (jdbc:mysql://...)
     * - Aiven / Railway / Cloud raw URIs (mysql://username:password@host:port/dbname?ssl-mode=REQUIRED)
     * - Automatically extracts credentials and sets Spring DataSource properties.
     */
    private static void normalizeDatabaseEnvironment() {
        String rawUrl = System.getenv("DB_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("MYSQL_URL");
        }

        if (rawUrl != null && !rawUrl.isBlank()) {
            rawUrl = rawUrl.trim();
            log.info("Detected database connection string: {}", maskUrl(rawUrl));

            try {
                String clean = rawUrl.startsWith("jdbc:") ? rawUrl.substring(5) : rawUrl;
                if (clean.startsWith("mysql://") && clean.contains("@")) {
                    URI uri = URI.create(clean);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] creds = userInfo.split(":", 2);
                        if (System.getenv("DB_USERNAME") == null && System.getProperty("DB_USERNAME") == null) {
                            System.setProperty("DB_USERNAME", creds[0]);
                            System.setProperty("spring.datasource.username", creds[0]);
                        }
                        if (System.getenv("DB_PASSWORD") == null && System.getProperty("DB_PASSWORD") == null) {
                            System.setProperty("DB_PASSWORD", creds[1]);
                            System.setProperty("spring.datasource.password", creds[1]);
                        }
                    }
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                    String path = uri.getPath();
                    String query = uri.getQuery();

                    StringBuilder jdbcUrl = new StringBuilder("jdbc:mysql://").append(host).append(":").append(port).append(path);
                    if (query != null && !query.isBlank()) {
                        String fixedQuery = query.replace("ssl-mode=REQUIRED", "useSSL=true&sslMode=REQUIRED");
                        jdbcUrl.append("?").append(fixedQuery);
                    } else {
                        jdbcUrl.append("?useSSL=true&allowPublicKeyRetrieval=true&serverTimezone=UTC");
                    }

                    String finalUrl = jdbcUrl.toString();
                    System.setProperty("DB_URL", finalUrl);
                    System.setProperty("spring.datasource.url", finalUrl);
                    log.info("Successfully normalized JDBC URL: {}", maskUrl(finalUrl));
                } else if (!rawUrl.startsWith("jdbc:")) {
                    String finalUrl = "jdbc:" + rawUrl;
                    System.setProperty("DB_URL", finalUrl);
                    System.setProperty("spring.datasource.url", finalUrl);
                    log.info("Prepended jdbc: prefix to URL: {}", maskUrl(finalUrl));
                }
            } catch (Exception e) {
                log.warn("Could not parse DB_URL as URI, using original: {}", e.getMessage());
            }
        } else {
            log.warn("==========================================================================");
            log.warn("CRITICAL: DB_URL environment variable is NOT set!");
            log.warn("Application is defaulting to localhost:3306, which fails in Docker.");
            log.warn("Please add DB_URL, DB_USERNAME, and DB_PASSWORD in Render Environment tab.");
            log.warn("==========================================================================");
        }
    }

    private static String maskUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll(":[^/@:]+@", ":****@");
    }
}
