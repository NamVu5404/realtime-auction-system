package com.namvu.realtimeauctionsystem.modules.auth.service.impl;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.AddressNotFoundException;
import com.maxmind.geoip2.model.CityResponse;
import com.namvu.realtimeauctionsystem.modules.auth.service.IpLocationService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;

@Service
@Slf4j
public class IpLocationServiceImpl implements IpLocationService {

    private DatabaseReader dbReader;
    private static final String UNKNOWN_LOCATION = "Unknown";

    @Value("${geoip.db-path:}")
    private String geoIpDbPath;

    @PostConstruct
    public void init() {
        try {
            InputStream database;
            File externalFile = new File(geoIpDbPath);
            if (!geoIpDbPath.isEmpty() && externalFile.exists()) {
                database = externalFile.toURI().toURL().openStream();
            } else {
                database = new ClassPathResource("GeoLite2-City.mmdb").getInputStream();
            }
            dbReader = new DatabaseReader.Builder(database).build();
        } catch (Exception e) {
            log.error("GeoLite2 Database load failed: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void destroy() {
        if (dbReader != null) {
            try {
                dbReader.close();
            } catch (IOException e) {
                log.error("Failed to close GeoLite2 database: {}", e.getMessage());
            }
        }
    }

    @Override
    public String getLocationString(String ip) {
        if (dbReader == null || ip == null || ip.isEmpty()) {
            return UNKNOWN_LOCATION;
        }

        try {
            InetAddress ipAddress = InetAddress.getByName(ip);

            if (isPrivateOrLocalIp(ipAddress)) {
                return "Localhost";
            }

            CityResponse response = dbReader.city(ipAddress);
            String country = response.getCountry().getName();
            String subdivision = response.getMostSpecificSubdivision().getName();

            return String.format("%s - %s",
                    subdivision != null ? subdivision : UNKNOWN_LOCATION,
                    country != null ? country : UNKNOWN_LOCATION);

        } catch (AddressNotFoundException e) {
            return UNKNOWN_LOCATION;
        } catch (Exception e) {
            log.error("GeoIP lookup failed for IP {}: {}", ip, e.getMessage());
            return UNKNOWN_LOCATION;
        }
    }

    private boolean isPrivateOrLocalIp(InetAddress address) {
        return address.isLoopbackAddress()
                || address.isSiteLocalAddress()
                || address.isLinkLocalAddress();
    }
}
