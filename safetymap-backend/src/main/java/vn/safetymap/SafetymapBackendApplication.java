package vn.safetymap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SafetymapBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SafetymapBackendApplication.class, args);
	}

}
