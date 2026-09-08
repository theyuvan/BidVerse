package com.example.bidverse.Security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Binds a controller method parameter of type {@link AuthenticatedUser} to the caller
 * resolved by {@link AuthInterceptor} from the Authorization header.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface CurrentUser {
}
