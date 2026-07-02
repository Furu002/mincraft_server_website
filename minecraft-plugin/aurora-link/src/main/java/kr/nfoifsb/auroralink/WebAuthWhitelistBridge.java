package kr.nfoifsb.auroralink;

import com.google.gson.Gson;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

public final class WebAuthWhitelistBridge {
  private final AuroraLinkPlugin plugin;
  private final Gson gson = new Gson();
  private final HttpClient client =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();

  public WebAuthWhitelistBridge(AuroraLinkPlugin plugin) {
    this.plugin = plugin;
  }

  public boolean enabled() {
    return plugin.getConfig().getBoolean("webauth-whitelist.enabled", true);
  }

  public RequestResult requestCode(String nickname, Map<String, Object> account) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("minecraftName", nickname);
    payload.put("accountName", accountName(account));
    Map<?, ?> response = post("/api/webauth/request", payload);
    if (!Boolean.TRUE.equals(response.get("ok"))) {
      throw new BridgeException("WebAuthWhitelist rejected code request.");
    }

    Object rawCode = response.get("code");
    String code = rawCode == null ? "" : String.valueOf(rawCode);
    long expiresAt = readLong(response.get("expiresAt"));
    if (code.isBlank() || expiresAt <= 0) {
      throw new BridgeException("WebAuthWhitelist returned an invalid code response.");
    }
    return new RequestResult(code, expiresAt);
  }

  public StatusResult status(String nickname) {
    Map<?, ?> response = get("/api/webauth/status?name=" + url(nickname));
    if (!Boolean.TRUE.equals(response.get("ok"))) {
      throw new BridgeException("WebAuthWhitelist rejected status request.");
    }
    boolean exists = Boolean.TRUE.equals(response.get("exists"));
    boolean pending = Boolean.TRUE.equals(response.get("pending"));
    boolean verified = Boolean.TRUE.equals(response.get("verified"));
    return new StatusResult(exists, pending, verified);
  }

  private Map<?, ?> post(String path, Map<String, Object> payload) {
    HttpRequest request =
        HttpRequest.newBuilder(uri(path))
            .timeout(Duration.ofSeconds(5))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(payload), StandardCharsets.UTF_8))
            .build();
    return send(request);
  }

  private Map<?, ?> get(String path) {
    HttpRequest request = HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(5)).GET().build();
    return send(request);
  }

  private Map<?, ?> send(HttpRequest request) {
    try {
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      Map<?, ?> body = gson.fromJson(response.body(), Map.class);
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new BridgeException("WebAuthWhitelist HTTP " + response.statusCode() + ".");
      }
      return body == null ? Map.of() : body;
    } catch (IOException error) {
      throw new BridgeException("Could not reach WebAuthWhitelist: " + error.getMessage(), error);
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt();
      throw new BridgeException("WebAuthWhitelist request was interrupted.", error);
    }
  }

  private URI uri(String path) {
    String base =
        plugin
            .getConfig()
            .getString("webauth-whitelist.base-url", "http://127.0.0.1:8124")
            .replaceAll("/+$", "");
    return URI.create(base + path);
  }

  private static String accountName(Map<String, Object> account) {
    String email = LinkStore.value(account.get("email"), "").trim();
    if (!email.isBlank()) return email;
    String provider = LinkStore.value(account.get("provider"), "site").trim();
    String sub = LinkStore.value(account.get("sub"), "").trim();
    if (!sub.isBlank()) return provider + ":" + sub;
    return LinkStore.value(account.get("name"), "website").trim();
  }

  private static long readLong(Object value) {
    if (value instanceof Number number) return number.longValue();
    try {
      return Long.parseLong(String.valueOf(value));
    } catch (NumberFormatException ignored) {
      return 0;
    }
  }

  private static String url(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  public record RequestResult(String code, long expiresAt) {}

  public record StatusResult(boolean exists, boolean pending, boolean verified) {}

  public static final class BridgeException extends RuntimeException {
    public BridgeException(String message) {
      super(message);
    }

    public BridgeException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
