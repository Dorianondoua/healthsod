package com.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HealthSurveillancesodApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealthSurveillancesodApplication.class, args);
	}

}
