package com.example.bidverse;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class BidverseApplicationTests {

	@Test
	void applicationEntryPointIsAvailable() {
		assertDoesNotThrow(() -> BidverseApplication.class.getDeclaredMethod("main", String[].class));
	}

}
